const {
  downloadMediaMessage,
  getContentType,
} = require("@whiskeysockets/baileys");
module.exports = {
  name: "readviewonce",
  alias: ["rvo"],
  description: "Read a view once image/video.",
  execute: async (msg, { bot, args }) => {
    let isQMedia = /image|video/i.test(getContentType(msg.quoted.message));
    if (msg.quoted && isQMedia) {
      if (!msg.quoted.message[getContentType(msg.quoted.message)].viewOnce) {
        return msg
          .react("⚠️")
          .then(() => msg.reply("This is not a view once message!"));
      }
      msg.react("⏳");
      let buffer = await downloadMediaMessage(
        msg.quoted,
        "buffer",
        {},
        { reuploadRequest: bot.updateMediaMessage }
      );
      if (buffer) {
        msg.react("✅");
        if (args[0] == "private") {
          bot.sendMessage(
            msg.sender,
            {
              [msg.quoted.type.replace(/message$/i, "")]: Buffer.from(buffer),
              caption: msg.quoted.text ? msg.quoted.text : "",
            },
            { quoted: msg }
          );
        } else
          msg.reply({
            [msg.quoted.type.replace(/message$/i, "")]: Buffer.from(buffer),
            caption: msg.quoted.text ? msg.quoted.text : "",
          });
      } else return msg.reply("Getting media failed.");
    } else
      return msg.reply(
        "Reply/include a view-once message then execute this command."
      );
  },
};
