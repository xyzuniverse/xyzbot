import { config } from "dotenv";
import Collection from "./lib/CommandCollections.ts";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
} from "baileys";
import { makeInMemoryStore } from "@renpwn/baileys-store";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const qrcode = require("qrcode-terminal");
import Pino from "pino";
import NodeCache from "node-cache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const msgRetryCounterCache = new NodeCache();

let low: any;
try {
    low = await import("lowdb");
} catch {
    low = await import("./lib/lowdb/index.ts");
}
const { Low, JSONFile } = low;

process.on("uncaughtException", console.error);

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("sessions");
    const { version } = await fetchLatestBaileysVersion();

    const store = makeInMemoryStore({ logger: Pino({ level: "silent" }) });
    store.readFromFile("./client_store.json");
    setInterval(() => {
        store.writeToFile("./client_store.json");
    }, 60_000);


    const bot = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" })),
        },
        msgRetryCounterCache: msgRetryCounterCache,
        getMessage: async (msg) => {
            if (store) {
                const storedMsg = await store.loadMessage(msg.remoteJid!, msg.id!);
                return storedMsg?.message || undefined;
            }
            return undefined;
        },
        logger: Pino({ level: "silent" }),
        syncFullHistory: false,
        retryRequestDelayMs: 10,
        transactionOpts: {
            maxCommitRetries: 10,
            delayBetweenTriesMs: 10,
        },
        maxMsgRetryCount: 15,
        appStateMacVerification: {
            patch: true,
            snapshot: true,
        },
    });


    store.bind(bot.ev);


    (bot as any).store = store;
    (bot as any).commands = new Collection<string, any>();
    (bot as any).db = null;


    const loadCommands = async (dir: string) => {
        (bot as any).commands.clear();
        const commandsPath = path.join(__dirname, dir);
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);

            if (!fs.statSync(folderPath).isDirectory()) continue;

            const commandFiles = fs
                .readdirSync(folderPath)
                .filter((file) => file.endsWith(".ts"));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);

                try {
                    const fileUrl = new URL(`file://${filePath}`);
                    fileUrl.searchParams.set('t', Date.now().toString());

                    const commandModule = await import(fileUrl.href);
                    const command = commandModule.default || commandModule;

                    command.category = folder;
                    (bot as any).commands.set(command.name, command);

                    if (command.alias && Array.isArray(command.alias)) {
                        command.alias.forEach((alias: string) => (bot as any).commands.set(alias, command));
                    }
                } catch (error) {
                    console.error(`Failed to load command from: ${filePath}:`, error);
                }
            }
        }
        console.log(`✅ Commands loaded: ${(bot as any).commands.size}`);
    };

    await loadCommands("commands");


    const watcher = chokidar.watch("./commands", {
        ignored: /^\./,
        persistent: true,
        ignoreInitial: true,
    });

    watcher
        .on("add", async (filePath: string) => {
            if (filePath.endsWith(".ts")) {
                console.log(`📄 File ${filePath} added, reloading...`);
                await loadCommands("commands");
            }
        })
        .on("change", async (filePath: string) => {
            if (filePath.endsWith(".ts")) {
                console.log(`📝 File ${filePath} changed, reloading...`);
                await loadCommands("commands");
            }
        })
        .on("unlink", async (filePath: string) => {
            if (filePath.endsWith(".ts")) {
                console.log(`🗑️  File ${filePath} removed, reloading...`);
                await loadCommands("commands");
            }
        });

    chokidar
        .watch("./.env", {
            persistent: true,
            ignoreInitial: true,
        })
        .on("change", () => {
            console.log("🔄 .env changed, reloading configs...");
            config({ override: true });
        });


    (bot as any).db = new Low(new JSONFile("./database.json"));

    if ((bot as any).db.data === null) {
        await (bot as any).db.read();
        (bot as any).db.data = {
            users: {},
            groups: {},
            ...((bot as any).db.data || {}),
        };
    }

    bot.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            console.log("❌ Connection closed");
            const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting...");
                await start();
            } else {
                console.log("🚪 Logged out");
            }
        } else if (connection === "open") {
            console.log("✅ Connected to WhatsApp!");

            if ((bot as any).db.data) {
                setInterval(async () => {
                    try {
                        await (bot as any).db.write();
                    } catch (error) {
                        console.error("💾 DB write failed:", error);
                        if (fs.existsSync("./database.json.tmp")) {
                            fs.unlinkSync("./database.json.tmp");
                        }
                    }
                }, 30_000);
            }
        }
    });


    const commandHandler = await import("./events/CommandHandler.ts");

    if (commandHandler.default?.chatUpdate) {
        bot.ev.on("messages.upsert", commandHandler.default.chatUpdate.bind(bot as any));
        console.log("✅ CommandHandler loaded!");
    } else {
        console.error("❌ CommandHandler.chatUpdate not found!");
    }

    bot.ev.on("creds.update", async () => {
        await saveCreds();
    });

    return bot;
}

start().catch(console.error);
