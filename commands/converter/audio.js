const { Worker } = require("worker_threads");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");

// fungsi untuk menjalankan konversi di worker thread
function convertVideoInWorker(inputFile, outputFile, bitrate) {
  return new Promise((resolve, reject) => {
    // --- PERBAIKAN UTAMA DI SINI ---
    // Arahkan ke lokasi baru di folder lib
    const worker = new Worker(path.join(__dirname, "../../lib/worker.js"), {
      workerData: { inputFile, outputFile, bitrate },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker berhenti dengan kode ${code}`));
      }
    });
  });
}

module.exports = {
  name: "audio",
  description: "Konversi video ke format audio (MP3) dengan custom bitrate.",
  execute: async (msg, { bot }) => {
    let targetMsg = msg.quoted ? msg.quoted : msg;
    let bitrate = "128k";

    if (msg.text) {
      const args = msg.text.split(" ");
      const bitrateArg = args.find(
        (arg) =>
          arg.toLowerCase().endsWith("k") || arg.toLowerCase().endsWith("m") ||
          arg.toLowerCase().endsWith("kbps") || arg.toLowerCase().endsWith("kbit/s") ||
          arg.toLowerCase().endsWith("mbps") || arg.toLowerCase().endsWith("mbit/s")
      );
      if (bitrateArg) {
        bitrate = bitrateArg;
        if (!/^\d+[km]$/i.test(bitrate) && !/^\d+(kbit\/s|kbps|mbit\/s|mbps)$/i.test(bitrate)) {
          return msg.reply("Format bitrate tidak valid. Contoh: 128k, 192k, 1m.");
        }
      }
    }

    const messageContent = targetMsg?.message || targetMsg?.msg;
    const isVideo = messageContent?.videoMessage || targetMsg.type === 'videoMessage';
    
    if (!isVideo) {
        return msg.reply(`Balas pesan video untuk mengkonversinya ke audio. Anda bisa menambahkan bitrate custom, contoh: .audio 192k`);
    }

    try {
      msg.react("⏳");

      const buffer = await downloadMediaMessage(
        targetMsg.raw || targetMsg,
        "buffer",
        {},
        { reuploadRequest: bot.updateMediaMessage }
      );

      if (!buffer) {
        msg.react("⚠️");
        return msg.reply("Gagal mengunduh media.");
      }

      const tempDir = path.join(__dirname, '../../temp');
      if (!fsSync.existsSync(tempDir)) {
          fsSync.mkdirSync(tempDir, { recursive: true });
      }
      
      const inputFile = path.join(tempDir, `input_${Date.now()}.mp4`);
      const outputFile = path.join(tempDir, `output_${Date.now()}.mp3`);

      await fs.writeFile(inputFile, buffer);
      await convertVideoInWorker(inputFile, outputFile, bitrate);
      const outputBuffer = await fs.readFile(outputFile);
      
      await fs.unlink(inputFile);
      await fs.unlink(outputFile);

      msg.react("✅");
      return bot.sendMessage(msg.from, {
        audio: outputBuffer,
        mimetype: "audio/mpeg",
      });
    } catch (error) {
      console.error("Error di perintah .audio:", error);
      msg.react("⚠️");
      if (error.message.includes('ffmpeg')) {
          return msg.reply("Terjadi kesalahan: Pastikan FFmpeg sudah terinstal di server Anda.");
      }
      return msg.reply("Terjadi kesalahan saat mengonversi video.");
    }
  },
};