const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const Pino = require("pino");
const NodeCache = require("node-cache");

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

async function connect(sessionDir) {
  // Client configuration
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  // Deploy the client
  const client = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" })),
    },
    msgRetryCounterCache,
    getMessage: () => {
      return proto.Message.fromObject(); // TODO: Create your own messagestore
    },
    logger: Pino({ level: "silent" }),
  });

  client.ev.on(
    "messages.upsert",
    require("../events/CommandHandler").chatUpdate.bind(client)
  );

  client.ev.on("creds.update", async () => {
    await saveCreds();
  });

  return client;
}

module.exports = { connect };
