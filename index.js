const { Boom } = require("@hapi/boom");
const {
  default: WASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const NodeCache = require("node-cache");
const helper = require("./lib/helper");

// Logger
const logger = require("pino")({
  transport: {
    target: "pino-pretty",
    options: {
      levelFirst: true,
      translateTime: true,
      ignore: "hostname",
    },
  },
}).child({ class: "Baileys", creator: "xyzuniverse" });

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
global.store = makeInMemoryStore({ logger });
store?.readFromFile("./.chat_store.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./.chat_store.json");
}, 10_000);

// Prevent to crash if error occured
process.on("uncaughtException", console.error);

// Database
var low;
try {
  low = require("lowdb");
} catch {
  low = require("./lib/lowdb");
}
const { Low, JSONFile } = low;
global.db = new Low(new JSONFile("database.json"));

const connect = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(".credentials");
  const { version } = await fetchLatestBaileysVersion();

  const client = WASocket({
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger: require("pino")({ level: "silent" }),
    msgRetryCounterCache,
    getMessage: async (key) => {
      return helper.getMessage(key, store);
    },
    version,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
  });

  store.bind(client.ev);

  client.ev.on("connection.update", async (update) => {
    logger.child(update).info("connection update");
    var { connection, lastDisconnect } = update;
    if (connection === "open") {
      logger.info("opened and connected to WA Web");
      if (global.db.data == null) await helper.loadDatabase();
    }
    if (connection === "connecting") logger.info("connecting to WA Web");
    if (update.qr) logger.info("Authenticate to continue");
    if (connection === "close") {
      logger.info("conection lost, reconnecting for a few seconds...");
      let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        connect();
      } else {
        logger.error("Disconnected from server because you're logged out, please regenerate a new session.");
        client.logout();
        fs.unlinkSync("./.credentials");
        process.exit();
      }
    }
  });

  client.ev.on("messages.upsert", require("./handler").chatHandler.bind(client));

  client.ev.on("creds.update", async () => {
    await saveCreds();
  });

  return client;
};

// Load database if database didn't load properly
helper.loadDatabase(global.db);

// Save database every minute & exit
setInterval(async () => {
  if (global.db) await global.db.write();
}, 30 * 1000);

process.on("exit", async () => {
  if (global.db) await global.db.write();
});

connect().catch((e) => console.error(e));
