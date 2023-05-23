const { Boom } = require("@hapi/boom");
const {
  default: WASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  useMultiFileAuthState,
  proto
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const NodeCache = require("node-cache");

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
const store = makeInMemoryStore({ logger });
store?.readFromFile("./.chat_store.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./.chat_store.json");
}, 10_000);

// Prevent to crash if error occured
process.on("uncaughtException", console.error);

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
    getMessage,
    version,
  });

  client.ev.on("connection.update", (update) => {
    logger.child(update).info("connection update");
    var { connection, lastDisconnect } = update;
    if (connection === "open") logger.info("opened and connected to WA Web");
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
        fs.unlinkSync("./sessions");
        process.exit();
      }
    }
  });

  client.ev.on("messages.upsert", (msg) => {
    smsg = require("./lib/serialize").serializeMessage(msg?.messages[0]);
    console.log(smsg)
  });

  client.ev.on("creds.update", async () => {
    await saveCreds();
  });

  return client;
};

async function getMessage(key) {
  if (store) {
    const msg = await store.loadMessage(key.remoteJid, key.id);
    return msg?.message || undefined;
  } else return proto.Message.fromObject({});
}

connect().catch((e) => console.error(e));
