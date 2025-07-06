const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { createStickerFromVideo } = require("../../lib/sticker");

async function getMediaBuffer(msg) {
  const type = Object.keys(msg.message || {})[0];
  const stream = await downloadContentFromMessage(msg.message[type],
    type.includes("video") ? "video" :
    type.includes("image") ? "image" : "document"
  );
  const chunks = [];
  for await (let chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = {
  name: "sticker",
  alias: ["s"],
  description: "Convert image/video (including document) to sticker.",
  execute: async (msg, { args, bot }) => {
    const q = msg.quoted ? msg.quoted : msg;
    const type = Object.keys(q.message || {})[0];
    const mimetype = q.message?.[type]?.mimetype || "";

    const isImage = mimetype.startsWith("image/");
    const isVideo = mimetype.startsWith("video/");
    const isMedia = isImage || isVideo;

    if (!isMedia) {
      return msg.reply("❌ Kirim atau reply gambar/video, termasuk yang dikirim sebagai dokumen, lalu ketik .s");
    }

    msg.react("⏳");

    try {
      const buffer = await getMediaBuffer(q);

      let sticker;
      if (isVideo) {
        sticker = await createStickerFromVideo(buffer, {
          pack: process.env.stickerPackname || "xyzbot",
          author: process.env.stickerAuthor || "xyzuniverse"
        });
      } else {
        sticker = new Sticker(buffer, {
          pack: process.env.stickerPackname || "xyzbot",
          author: process.env.stickerAuthor || "xyzuniverse",
          type: StickerTypes.FULL,
          quality: 50,
        });
      }

      msg.react("✅");
      return msg.reply(await sticker.toMessage());

    } catch (err) {
      console.error("Sticker conversion error:", err);
      msg.react("⚠️");
      return msg.reply("❌ Gagal mengonversi media. Pastikan kamu mengirim media yang valid.");
    }
  },
};
