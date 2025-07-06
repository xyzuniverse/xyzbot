const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs/promises");
const path = require("path");

module.exports = {
  name: "toimage",
  description: "Mengubah stiker WhatsApp menjadi gambar.",
  execute: async (msg, { bot }) => {
    let targetMsg = msg.quoted ? msg.quoted : msg;

    if (!targetMsg.type || !["stickerMessage"].includes(targetMsg.type)) {
      return msg.reply("Balas pesan stiker untuk mengubahnya menjadi gambar.");
    }

    try {
      msg.react("⏳");

      const buffer = await downloadMediaMessage(
        targetMsg,
        "buffer",
        {},
        { reuploadRequest: bot.updateMediaMessage }
      );

      if (!buffer) {
        msg.react("⚠️");
        return msg.reply("Gagal mengunduh stiker.");
      }

      const filename = `sticker_${Date.now()}.png`;
      const filepath = path.join(__dirname, "../../temp", filename);

      await fs.writeFile(filepath, buffer);

      msg.react("✅");
      await bot.sendMessage(msg.from, {
        image: { url: filepath },
        caption: "gweh thevoid kerasin!",
      });

      await fs.unlink(filepath);
    } catch (error) {
      console.error("Error:", error);
      msg.react("⚠️");
      return msg.reply("Terjadi kesalahan saat memproses stiker: " + error);
    }
  },
};
