const { Sticker: createSticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

let handler = async (msg, { client, text }) => {
  let q = msg.hasQuotedMessage ? await msg.getQuotedMessage() : msg;
  if (q.hasMedia) {
    msg.react("⏳");
    let buffer = await downloadMediaMessage(q, "buffer", {}, { reuploadRequest: client.updateMediaMessage });
    let sticker = new createSticker(buffer, {
      pack: global.sticker.packname,
      author: global.sticker.author,
      type: StickerTypes.FULL,
      quality: 50,
    });
    if (sticker) {
      msg.react("✅");
      return msg.reply(await sticker.toMessage());
    } else {
      msg.react("⚠️");
      return msg.reply("Conversion failed, please contact owner to resolve this issue.");
    }
  } else return msg.reply("Reply/include a media message then execute this command.");
};

handler.command = /^s(tic?ker)?(gif)?$/i;
module.exports = handler;
