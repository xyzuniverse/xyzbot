const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { createStickerFromVideo } = require("../../lib/sticker"); // ← tambahkan ini

module.exports = {
  name: "sticker",
  alias: ["s"],
  description: "Convert image/video message into sticker.",
  execute: async (msg, { args, bot }) => {
    let q = msg.quoted ? msg.quoted : msg;
    let isMedia = ["image", "video"].includes(q.type.replace(/message$/i, ""));
    if (!isMedia) return msg.reply("Reply media dengan .s");

    msg.react("⏳");
    try {
      const buffer = await downloadMediaMessage(
        q,
        "buffer",
        {},
        { reuploadRequest: bot.updateMediaMessage }
      );

      let sticker;
      if (q.type.includes("video")) {
        // gunakan konversi video dengan potong durasi dan kompresi
        sticker = await createStickerFromVideo(buffer, {
          pack: process.env.stickerPackname,
          author: process.env.stickerAuthor,
        });
      } else {
        // konversi gambar seperti biasa
        sticker = new Sticker(buffer, {
          pack: process.env.stickerPackname || "xyzbot",
          author: process.env.stickerAuthor || "xyzuniverse",
          type: StickerTypes.FULL,
          quality: 50,
        });
      }

      msg.react("✅");
      return msg.reply(await sticker.toMessage());

    } catch (e) {
      console.error(e);
      msg.react("⚠️");
      return msg.reply("Gagal mengonversi media.");
    }
  },
};
