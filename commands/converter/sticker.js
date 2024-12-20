const {
  Sticker: createSticker,
  StickerTypes,
} = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "sticker",
  alias: ["s"],
  description: "Convert image/video message into sticker.",
  execute: async (msg, { args, bot }) => {
    let q = msg.quoted ? msg.quoted : msg;
    let isMedia = ["image", "video"].includes(q.type.replace(/message$/i, ""));
    if (isMedia) {
      msg.react("⏳");
      let buffer = await downloadMediaMessage(
        q,
        "buffer",
        {},
        { reuploadRequest: bot.updateMediaMessage }
      );
      let sticker = new createSticker(buffer, {
        pack: "xyzbot's stickers.",
        author: "xyzuniverse - rexprjkt on github.",
        type: StickerTypes.FULL,
        quality: 50,
      });
      if (sticker) {
        msg.react("✅");
        return msg.reply(await sticker.toMessage());
      } else {
        msg.react("⚠️");
        return msg.reply(
          "Conversion failed, please contact owner to resolve this issue."
        );
      }
    } else
      return msg.reply(
        "Reply/include a media message then execute this command."
      );
  },
};
