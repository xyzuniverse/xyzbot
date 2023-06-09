const { MessageMedia } = require("whatsapp-web.js");

let handler = async (msg, { client, text, args, usedPrefix, command }) => {
  if (!text) return msg.reply("```" + `Format: ${usedPrefix}${command} <query>` + "```");
  try {
    var media;
    text = text.toLowerCase();
    if (args[0].toLowerCase().includes("mc") || args[0].toLowerCase().includes("trailblazer")) {
      if (!args[1]) return msg.reply("Query MC? physical/fire");
      media = await MessageMedia.fromUrl(
        `https://raw.githubusercontent.com/FortOfFans/HSR/main/sheet/${
          args[1] === "api" || args[1] === "fire" ? "Fire" : "Physical"
        }%20Trailblazer.jpg`
      );
    } else if (text.includes(" ")) {
      text = text.split(" ");
      for (var i = 0; i < text.length; i++) {
        text[i] = text[i].charAt(0).toUpperCase() + text[i].slice(1);
      }
      media = await MessageMedia.fromUrl(`https://raw.githubusercontent.com/FortOfFans/HSR/main/sheet/${encodeURIComponent(text.join(" "))}.jpg`);
    } else
      media = await MessageMedia.fromUrl(
        `https://raw.githubusercontent.com/FortOfFans/HSR/main/sheet/${text.charAt(0).toUpperCase() + text.slice(1)}.jpg`
      );
  } catch (e) {
    return msg.reply(e.toString());
  } finally {
    if (media.filesize < 100) return msg.reply("Data karakter tidak ditemukan!");
    else return await msg.reply(media);
  }
};

handler.help = ["hsrcharacter <query>", "hsrchar <query>"];
handler.tags = ["hyv"];

handler.command = /^hsrchar?(acter)?$/i;

module.exports = handler;
