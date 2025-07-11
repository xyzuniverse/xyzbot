// index.js (MENGGUNAKAN STORE KUSTOM)
require("dotenv").config();
const Collection = require("./lib/CommandCollections");
const fs = require("fs");
const path = require("node:path");
const chokidar = require("chokidar");
// --- FUNGSI UNTUK MEMUAT JADWAL SHOLAT SAAT STARTUP ---
const cron = require('node-cron');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

// Impor fungsi yang benar dari sholat.js
const { getPrayerTimes, schedulePrayerNotifications } = require('./commands/islamic/sholat.js').internalFunctions || {};

async function initializeSchedules(bot) {
  // Pastikan fungsi berhasil diimpor sebelum melanjutkan
  if (typeof getPrayerTimes !== 'function' || typeof schedulePrayerNotifications !== 'function') {
    console.log("Fungsi internal sholat tidak ditemukan, penjadwalan startup dilewati.");
    return;
  }

  console.log("Memuat dan menginisialisasi jadwal sholat dari database...");
  if (!bot.db.data || !bot.db.data.groups) {
    console.log("Database atau data grup tidak ditemukan, penjadwalan dilewati.");
    return;
  }

  const groups = bot.db.data.groups;
  for (const groupId in groups) {
    if (groups[groupId].sholat_city_id) {
      const cityId = groups[groupId].sholat_city_id;
      try {
        const prayerTimes = await getPrayerTimes(cityId);
        if (prayerTimes) {
          // Panggil fungsi yang diimpor dan pastikan semua parameter dikirim
          schedulePrayerNotifications(bot, groupId, prayerTimes, cityId);
        }
      } catch (e) {
        console.error(`Gagal memuat jadwal untuk grup ${groupId} (ID: ${cityId}):`, e.message);
      }
    }
  }
}

// Impor Baileys tanpa makeInMemoryStore
const Baileys = require("@whiskeysockets/baileys");
const {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
} = Baileys;

const makeWASocket = Baileys.default || Baileys;

// Impor Store Kustom kita
const { createCustomStore } = require('./lib/CustomStore.js');

const Pino = require("pino");
const NodeCache = require("node-cache");

const msgRetryCounterCache = new NodeCache();

var low;
try {
  low = require("lowdb");
} catch {
  low = require("./lib/lowdb");
}
const { Low, JSONFile } = low;

process.on("uncaughtException", console.error);

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const { version } = await fetchLatestBaileysVersion();

  // Gunakan Store Kustom kita di sini
  const store = createCustomStore({ logger: Pino({ level: "silent" }) });

  const bot = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" })),
    },
    msgRetryCounterCache: msgRetryCounterCache,
    getMessage: async (key) => {
      // Ambil pesan dari store kustom kita
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return proto.Message.fromObject({});
    },
    logger: Pino({ level: "silent" }),
    syncFullHistory: false
  });

  // Ikat event ke store kustom kita
  store.bind(bot.ev);
  bot.store = store;

  bot.commands = new Collection();
  loadCommands("commands", bot);

  chokidar.watch("./commands", { persistent: true, ignoreInitial: true })
    .on("all", () => loadCommands("commands", bot));

  bot.db = new Low(new JSONFile("./database.json"));
  await bot.db.read();
  bot.db.data = bot.db.data || { users: {}, groups: {} };

  setInterval(() => {
    bot.db.write().catch(console.error);
  }, 30 * 1000);

  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Jika ada QR code, tampilkan di terminal
    if (qr) {
      console.log("Pindai QR code ini untuk terhubung:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi ditutup karena: ${lastDisconnect.error}, menyambung ulang: ${shouldReconnect}`);
      if (shouldReconnect) {
        start();
      }
    } else if (connection === "open") {
      console.log("Koneksi terbuka, memuat jadwal sholat...");
      // PANGGIL FUNGSI INISIALISASI DI SINI
      await initializeSchedules(bot);
    }
    console.log("connection update", update);
  });

  bot.ev.on("creds.update", saveCreds);
  bot.ev.on("messages.upsert", require("./events/CommandHandler").chatUpdate.bind(bot));
}

function loadCommands(dir, bot) {
  bot.commands.clear();
  const commandsPath = path.join(__dirname, dir);
  fs.readdirSync(commandsPath).forEach(folder => {
    const folderPath = path.join(commandsPath, folder);
    fs.readdirSync(folderPath).filter(file => file.endsWith(".js")).forEach(file => {
      const filePath = path.join(folderPath, file);
      delete require.cache[require.resolve(filePath)];
      try {
        const command = require(filePath);
        command.category = folder;
        bot.commands.set(command.name, command);
        if (command.alias) {
          command.alias.forEach(alias => bot.commands.set(alias, command));
        }
      } catch (error) {
        console.error(`Gagal memuat perintah dari ${filePath}:`, error);
      }
    });
  });
  console.log(`Perintah berhasil dimuat: ${bot.commands.size} perintah.`);
}

start().catch(console.error);
