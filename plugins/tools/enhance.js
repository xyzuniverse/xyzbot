const Replicate = require("replicate");
const { uploadImage } = require("../../lib/helper");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
let handler = async (msg, { client, text }) => {
  let q = msg.hasQuotedMessage ? await msg.getQuotedMessage() : msg;
  if (q.hasMedia && q.type == "imageMessage") {
    try {
      msg.react("⏳");
      const replicate = new Replicate({
        auth: global.apiKey.replicate,
      });
      const file = await uploadImage(await downloadMediaMessage(q, "buffer", {}, { reuploadRequest: client.updateMediaMessage }));
      const model = "xinntao/realesrgan:1b976a4d456ed9e4d1a846597b7614e79eadad3032e9124fa63859db0fd59b56";
      const input = {
        img: file,
        version: text.includes("anime") ? "Anime - anime6B" : "General - RealESRGANplus",
      };
      const output = await replicate.run(model, { input });
      if (output) {
        msg.react("✅");
        return await client.sendMessage(
          msg.from,
          {
            text: "Here.",
            footer: global.sticker.author,
            templateButtons: [{ index: 1, urlButton: { displayText: "Click here to download!", url: output } }],
            image: { url: output },
          },
          {
            quoted: msg,
          }
        );
      }
    } catch (e) {
      return msg.reply(e.toString());
    }
  } else return msg.reply("Insert a image message!");
};

handler.command = /^(enhance)$/i;

module.exports = handler;
