// index.js (Versi Perbaikan Final)

require("dotenv").config();

// Impor semua yang dibutuhkan dari Baileys dan library lain
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto
} = require('@whiskeysockets/baileys');

const Pino = require('pino');
const { Low, JSONFile } = require("./lib/lowdb");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const qrcode = require('qrcode-terminal');
const Collection = require("./lib/CommandCollections");
const { createCustomStore } = require('./lib/CustomStore.js');

// --- Fungsi untuk memuat jadwal sholat (jika ada) ---
const { getPrayerTimes, schedulePrayerNotifications } = require('./commands/islamic/sholat.js').internalFunctions || {};

async function initializeSchedules(bot) {
  if (typeof getPrayerTimes !== 'function' || typeof schedulePrayerNotifications !== 'function') {
    console.log("[SHOLAT] Fungsi internal tidak ditemukan, penjadwalan dilewati.");
    return;
  }
  console.log("[SHOLAT] Menginisialisasi jadwal sholat dari database...");
  if (!bot.db?.data?.groups) {
    console.log("[SHOLAT] Database atau data grup tidak ditemukan, penjadwalan dilewati.");
    return;
  }
  for (const groupId in bot.db.data.groups) {
    if (bot.db.data.groups[groupId].sholat_city_id) {
      const cityId = bot.db.data.groups[groupId].sholat_city_id;
      try {
        const prayerTimes = await getPrayerTimes(cityId);
        if (prayerTimes) {
          schedulePrayerNotifications(bot, groupId, prayerTimes, cityId);
        }
      } catch (e) {
        console.error(`[SHOLAT] Gagal memuat jadwal untuk grup ${groupId}:`, e.message);
      }
    }
  }
}

// Fungsi utama untuk menjalankan bot
async function startBot() {
  console.log('[LOG] Memulai bot...');

  // Mengelola Autentikasi dan Sesi
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const { version } = await fetchLatestBaileysVersion();

  // Menggunakan Store Kustom
  const store = createCustomStore({ logger: Pino({ level: "silent" }) });

  const bot = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" })),
    },
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false, // Penting untuk menangani QR secara manual
    browser: ['My-WhatsApp-Bot', 'Chrome', '1.0.0'],
    getMessage: async (key) => store.loadMessage(key.remoteJid, key.id),
  });

  // Mengikat store ke event bot
  store.bind(bot.ev);
  bot.store = store;

  // Memuat Database
  const dbPath = path.join(__dirname, 'database.json');
  bot.db = new Low(new JSONFile(dbPath));

  await bot.db.read();
  bot.db.data = bot.db.data || { users: {}, groups: {} };
  setInterval(() => {
    bot.db.write().catch(console.error);
  }, 30 * 1000);

  // Memuat Perintah
  bot.commands = new Collection();
  loadCommands("commands", bot);
  chokidar.watch("./commands", { persistent: true, ignoreInitial: true })
    .on("all", () => loadCommands("commands", bot));

  // Menangani Event Koneksi
  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('------------------------------------------------');
      console.log('📱 Pindai QR Code di bawah ini untuk terhubung:');
      qrcode.generate(qr, { small: true });
      const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`;
      console.log('\n Atau, jika QR di atas berantakan, buka link ini:\n', qrLink);
      console.log('------------------------------------------------');
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[CONNECTION] Terputus karena: ${lastDisconnect.error}, menyambung ulang: ${shouldReconnect}`);
      if (shouldReconnect) {
        startBot();
      } else {
        console.log('[CONNECTION] Terputus permanen. Hapus folder "sessions" dan mulai ulang.');
      }
    } else if (connection === "open") {
      console.log(`✅ Koneksi berhasil tersambung sebagai ${bot.user.name || 'Bot'}`);
      await initializeSchedules(bot);
    }
  });

  // Menangani Event Lainnya
  bot.ev.on("creds.update", saveCreds);
  bot.ev.on("messages.upsert", require("./events/CommandHandler").chatUpdate.bind(bot));
}

// Fungsi untuk memuat file perintah
function loadCommands(dir, bot) {
  bot.commands.clear();
  const commandsPath = path.join(__dirname, dir);
  fs.readdirSync(commandsPath).forEach(folder => {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
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
    }
  });
  console.log(`[COMMANDS] Berhasil dimuat: ${bot.commands.size} perintah.`);
}

// Menjalankan bot
startBot().catch(console.error);

// Menangani error yang tidak tertangkap
process.on("uncaughtException", console.error);