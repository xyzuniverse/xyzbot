const { downloadMediaMessage } = require("@whiskeysockets/baileys");
let handler = async (msg, { client, text }) => {
  let q = msg.hasQuotedMessage ? await msg.getQuotedMessage() : msg;
  if (q.hasMedia && q.content.viewOnce) {
    msg.react("⏳");
    let buffer = await downloadMediaMessage(q, "buffer", {}, { reuploadRequest: client.updateMediaMessage });
    if (buffer) {
      msg.react("✅");
      if (text == "private") {
        client.sendMessage(msg.author, { [q.type.replace(/message$/i, "")]: Buffer.from(buffer) }, { quoted: msg });
      } else msg.reply({ [q.type.replace(/message$/i, "")]: Buffer.from(buffer) });
    } else return msg.reply("Getting media failed.");
  } else return msg.reply("Reply/include a view-once message then execute this command.");
};

handler.command = /^(readviewonce)$/i;

module.exports = handler;
