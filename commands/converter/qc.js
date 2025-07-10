const quote = require("@neoxr/quote-api");
const PhoneNumber = require("awesome-phonenumber");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

module.exports = {
  name: "qc",
  description: "Ubah sebuah pesan menjadi stiker kutipan (quote).",
  execute: async (msg, { bot, args }) => {
    
    // --- PERBAIKAN LOGIKA PENGAMBILAN TEKS ---
    const quotedMessage = msg.quoted;
    const text = (quotedMessage?.text) || args.join(" ");

    if (!text) {
      return msg.reply("⚠️ Tulis sebuah teks atau reply pesan yang ingin dijadikan stiker quote.");
    }

    // --- LOGIKA UTAMA (TIDAK BERUBAH) ---
    const sender = quotedMessage?.sender || msg.sender;
    const pushName = quotedMessage ? 
        (bot.db.data.users[sender]?.name || quotedMessage.pushName || PhoneNumber('+' + sender.split('@')[0]).getNumber('international')) :
        (msg.pushName);

    let pp;
    try {
      pp = await bot.profilePictureUrl(sender);
    } catch {
      pp = "https://telegra.ph/file/2b1ed079ea221a4ea3237.png"; // Gambar profil default
    }

    const request = {
      type: "quote",
      format: "png",
      backgroundColor: "#202c33",
      width: 512,
      height: 768,
      scale: 2,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: pushName,
          photo: { url: pp },
        },
        text: text,
        replyMessage: {},
      }],
    };
    
    await msg.react("⏳");
    
    try {
      const res = await quote(request);
      const buffer = Buffer.from(res.image, "base64");
      
      const sticker = new Sticker(buffer, {
        pack: process.env.stickerPackname || "Quote Stiker",
        author: process.env.stickerAuthor || bot.user.name,
        type: StickerTypes.FULL,
        quality: 50,
      });

      // --- PERBAIKAN METODE PENGIRIMAN ---
      await bot.sendMessage(msg.from, await sticker.toMessage(), { quoted: msg });
      await msg.react("✅");

    } catch (err) {
      console.error("Gagal membuat stiker quote:", err);
      await msg.react("⚠️");
      await msg.reply("Terjadi kesalahan saat membuat stiker.");
    }
  },
};