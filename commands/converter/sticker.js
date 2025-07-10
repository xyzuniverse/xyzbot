const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { createStickerFromVideo } = require("../../lib/sticker.js");

module.exports = {
  name: "sticker",
  alias: ["s"],
  description: "Ubah gambar/video/dokumen menjadi stiker.",
  execute: async (msg, { bot }) => {
    
    let targetMsg = msg.quoted || msg;
    
    const validTypes = ['imageMessage', 'videoMessage', 'documentMessage'];
    if (!validTypes.includes(targetMsg.type)) {
        return msg.reply("❌ Kirim atau reply media yang valid dengan caption `.s`.");
    }

    let isVideo = targetMsg.type === 'videoMessage';
    if (targetMsg.type === 'documentMessage') {
        const mimetype = targetMsg.msg?.mimetype || '';
        if (mimetype.startsWith('video')) {
            isVideo = true;
        } else if (!mimetype.startsWith('image')) {
            return msg.reply("❌ Dokumen yang dikirim bukan gambar atau video.");
        }
    }

    await msg.react("⏳");
    try {
        const messageToDownload = targetMsg.isViewOnce ? targetMsg.raw : targetMsg;
        const buffer = await downloadMediaMessage(
            messageToDownload,
            "buffer",
            {},
            { reuploadRequest: bot.updateMediaMessage }
        );

        let sticker;
        const stickerOptions = {
            pack: process.env.stickerPackname || "Bot Stiker",
            author: process.env.stickerAuthor || "Dibuat oleh Bot",
            type: StickerTypes.FULL,
            quality: 50,
        };

        // --- GUNAKAN FUNGSI BERBEDA UNTUK VIDEO ---
        if (isVideo) {
            console.log("Membuat stiker dari video menggunakan logika kustom...");
            sticker = await createStickerFromVideo(buffer, stickerOptions);
        } else {
            console.log("Membuat stiker dari gambar menggunakan logika standar...");
            sticker = new Sticker(buffer, stickerOptions);
        }

        await bot.sendMessage(msg.from, await sticker.toMessage(), { quoted: msg });
        await msg.react("✅");

    } catch (err) {
      console.error("Kesalahan saat konversi stiker:", err);
      await msg.react("⚠️");
      // Memberikan pesan error yang lebih spesifik jika ffmpeg tidak ada
      if (err.message.includes('ffmpeg')) {
          return msg.reply("❌ Gagal membuat stiker video. Pastikan FFmpeg sudah terinstal di server.");
      }
      if (err.message.includes('too large')) {
          return msg.reply("❌ Gagal membuat stiker. Ukuran media terlalu besar.");
      }
      return msg.reply("❌ Gagal membuat stiker. Pastikan media valid.");
    }
  },
};