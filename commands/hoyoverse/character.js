const fs = require("fs");
module.exports = {
  name: "character",
  alias: ["char"],
  description: "Get character builds (HSR/Genshin)",
  execute: async (msg, { bot, args }) => {
    let text = args.join(" ");
    msg.react("⚡");
    if (!text) return msg.reply("Insert the character?");
    switch (text) {
      case "mc api":
      case "mc fire":
      case "mc preservation":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mc_fire.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "mc physical":
      case "mc physic":
      case "mc destruction":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mc_physical.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "mc ice":
      case "mc remembrance":
      case "rmc":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mc_ice.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "mc harmony":
      case "mc imaginary":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mc_harmony.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "march 7th imaginary":
      case "march 7th hunt":
      case "march imaginary":
      case "march hunt":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/march_imaginary.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "traveler pyro":
      case "pyro traveler":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/pyrotraveller.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "mavuika":
      case "mavuika main":
      case "mavuika main dps":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mavuika.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;
      case "mavuika sub":
      case "mavuika sub dps":
        await msg.reply({
          image: fs.readFileSync("./lib/chars/mavuika_sub_dps.jpg"),
          caption: process.env.stickerAuthor,
        });
        break;    
      default:
        try {
          await msg.reply({
            image: fs.readFileSync("./lib/chars/" + args.join("_") + ".jpg"),
            caption: process.env.stickerAuthor,
          });
        } catch (e) {
          console.log(e);
          msg.reply(
            "Hmm... We don't have the character that you've provided. Maybe try again later or report owner to add suggestions?"
          );
        }
    }
  },
};
