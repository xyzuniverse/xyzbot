const axios = require("axios");
const PhoneNumber = require("awesome-phonenumber");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

let handler = async (msg, { client, text }) => {
  let q = msg.hasQuotedMessage ? await msg.getQuotedMessage() : msg;
  text = msg.hasQuotedMessage ? q.body : text;
  if (!text) {
    msg.react("⚠️");
    return msg.reply("Ketikkan sebuah teks atau reply sebuah pesan!");
  }

  if (q.mentionedJid) {
    for (let users of q.mentionedJid) {
      let name = global.db.data.users[users]
        ? global.db.data.users[users].name
        : areJidsSameUser(serializeJid(client.user.id), users)
        ? client.user.name
        : PhoneNumber("+" + users.split("@")[0]).getNumber("international");
      text = text.replace("@" + users.split`@`[0], chalk.blueBright("@" + name));
    }
  }

  // Try to get Profile picture
  var pp;
  try {
    pp = await client.profilePictureUrl(q.author);
  } catch {
    pp = "https://telegra.ph/file/2b1ed079ea221a4ea3237.png";
  }

  // Generate a quoted chat
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
          name: q.pushName || client.user.name,
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
  const { data } = await axios.post("https://bot.lyo.su/quote/generate", request, {
    headers: { "Content-Type": "application/json" },
  });

  if (data) {
    const sticker = new Sticker(Buffer.from(data.result.image, "base64"), {
      pack: global.sticker.packname,
      author: global.sticker.author,
      type: StickerTypes.FULL,
      quality: 50,
    });
    if (sticker) {
      msg.react("✅");
      return msg.reply(await sticker.toMessage());
    }
  } else {
    msg.react("⚠️");
    return msg.reply("A error occured, please try again.");
  }
};

handler.command = /^(qc)$/i;
module.exports = handler;
