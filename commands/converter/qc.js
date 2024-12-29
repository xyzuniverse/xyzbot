const quote = require("@neoxr/quote-api");
const PhoneNumber = require("awesome-phonenumber");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

module.exports = {
  name: "qc",
  description: "Convert a message into sticker.",
  execute: async (msg, { bot, args }) => {
    let q = msg.quoted ? msg.quoted : msg;
    let text = q.text ? q.text : args.join(" ");
    if (!text) {
      msg.react("⚠️").then(() => {
        return msg.reply("Type a text or reply to a message!");
      });
    }
    let pushName = bot.db.data.users[q.sender]
      ? bot.db.data.users[q.sender].name
      : q.pushName
      ? q.pushName
      : bot.user.name;
    if (q.mentionedJid) {
      for (let users of q.mentionedJid) {
        let name = bot.db.data.users[users]
          ? bot.db.data.users[users].name
          : areJidsSameUser(serializeJid(bot.user.id), users)
          ? bot.user.name
          : PhoneNumber("+" + users.split("@")[0]).getNumber("international");
        text = text.replace("@" + users.split`@`[0], "@" + name);
      }
    }
    // Try to get Profile picture
    var pp;
    try {
      pp = await bot.profilePictureUrl(q.sender);
    } catch {
      pp = "https://telegra.ph/file/2b1ed079ea221a4ea3237.png";
    }

    const request = {
      type: "quote",
      format: "png",
      backgroundColor: "#202c33",
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: pushName,
            photo: {
              url: pp,
            },
          },
          text: text,
          replyMessage: {},
        },
      ],
    };
    msg.react("⏳");
    quote(request).then(async (res) => {
      const buffer = Buffer.from(res.image, "base64");
      const sticker = new Sticker(buffer, {
        pack: process.env.stickerPackname
          ? process.env.stickerPackname
          : "xyzbot's stickers.",
        author: process.env.stickerAuthor
          ? process.env.stickerAuthor
          : "xyzuniverse - rexprjkt on github.",
        type: StickerTypes.FULL,
        quality: 50,
      });
      if (sticker) {
        msg.react("✅");
        return msg.reply(await sticker.toMessage());
      }
    });
  },
};
