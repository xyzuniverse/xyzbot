require("dotenv").config();
const Collection = require("./lib/CommandCollections");
const fs = require("fs");
const path = require("node:path");
const chokidar = require("chokidar");
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");
const Pino = require("pino");
const NodeCache = require("node-cache");

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// LowDB
var low;
try {
  low = require("lowdb");
} catch {
  low = require("./lib/lowdb");
}
const { Low, JSONFile } = low;

// Prevent exit if it's closed
process.on("uncaughtException", console.error);

async function start() {
  // Client configuration
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const { version } = await fetchLatestBaileysVersion();

  // Client store
  const store = makeInMemoryStore({ logger: Pino({ level: "silent" }) });
  // can be read from a file
  store.readFromFile("./client_store.json");
  // saves the state to a file every 1minute
  setInterval(() => {
    store.writeToFile("./client_store.json");
  }, 60_000);

  // Deploy the client
  const bot = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" })),
    },
    msgRetryCounterCache: msgRetryCounterCache,
    getMessage: async (msg) => {
      if (store) {
        const storedMsg = await store.loadMessage(msg.remoteJid, msg.id);
        return storedMsg.message || undefined;
      }
      return proto.Message.fromObject({});
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

  // Bind the store
  store.bind(bot.ev);
  bot.store = store;

  // Command manager
  bot.commands = new Collection();

  // Load the commands
  const loadCommands = (dir) => {
    bot.commands.clear();
    const commandsPath = path.join(__dirname, dir);
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        delete require.cache[require.resolve(filePath)];
        try {
          const command = require(filePath);
          command.category = folder;
          bot.commands.set(command.name, command); // Set the main name

          if (command.alias && Array.isArray(command.alias)) {
            command.alias.forEach((alias) => bot.commands.set(alias, command)); // Set aliases
          }
        } catch (error) {
          console.error(`Failed to load command from: ${filePath}:`, error);
        }
      }
    }
    console.log(bot.commands);
    console.log(`All commands has been loaded. Total commands: ${bot.commands.size}`);
  };

  loadCommands("commands");

  // Watch the commands folder if there's some changes
  const watcher = chokidar.watch("./commands", {
    ignored: /^\./, // Abaikan file yang diawali dengan titik (.)
    persistent: true,
    ignoreInitial: true, // Jangan load saat pertama kali dijalankan
  });

  watcher
    .on("add", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been added, reloading commands...`);
        loadCommands("commands");
      }
    })
    .on("change", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been changed, reloading commands...`);
        loadCommands("commands");
      }
    })
    .on("unlink", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been removed, reloading commands...`);
        loadCommands("commands");
      }
    });

  chokidar
    .watch("./.env", {
      persistent: true,
      ignoreInitial: true,
    })
    .on("change", () => {
      console.log("File .env has been changed, reloading configs...");
      require("dotenv").config({ override: true });
    });

  // Database
  bot.db = new Low(new JSONFile("./database.json"));

  // Try to load database
  if (bot.db.data === null) {
    await bot.db.read();
    bot.db.data = {
      users: {},
      groups: {},
      ...(bot.db.data || {}),
    };
  }

  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("connection closed");
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        await start();
      } else {
        console.log("Connection closed. You are logged out.");
      }
    } else if (connection === "open") {
      // Save database
      if (bot.db.data) {
        setInterval(async () => {
          try {
            await bot.db.write();
          } catch {
            fs.unlinkSync("./database.json.tmp"); // remove temporary database (sometimes throws this error tho)
          }
          if (fs.existsSync("./database.json.tmp")) {
            fs.unlinkSync("./database.json.tmp"); // remove temporary database file for prevent error writing into database
          }
        }, 30 * 1000);
      }
    }
    console.log("connection update", update);
  });

  bot.ev.on("messages.upsert", require("./events/CommandHandler").chatUpdate.bind(bot));

  bot.ev.on("creds.update", async () => {
    await saveCreds();
  });

  return bot;
}

start().catch(console.error);