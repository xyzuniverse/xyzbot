const axios = require("axios");

module.exports = {
  name: "manga",
  description: "Get manga information from Jikan API",
  group: false,
  private: false,
  execute: async (msg, { args, bot }) => {
    if (args.length === 0) {
      return msg.reply("Please provide the name of the manga!");
    }

    const mangaName = args.join(" ");

    try {
      msg.react("⏳");
      const response = await axios.get(
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(
          mangaName
        )}&limit=1`
      );
      const manga = response.data.data[0];

      if (!manga) {
        msg.react("⚠️").then(() => {
          msg.reply("Sorry, I couldn't find any manga with that name.");
        });
      }

      msg.react("✅");
      const mangaInfo = `
*Title*: ${manga.title}
*English Title*: ${manga.title_english || "N/A"}
*Japanese Title*: ${manga.title_japanese || "N/A"}
*Type*: ${manga.type}
*Synopsis*: ${manga.synopsis || "No description available."}
*Rating*: ${manga.rating || "No rating"}
*Episodes*: ${manga.chapters || "Unknown"}
*Status*: ${manga.status}
*Rank*: ${manga.rank}
*Genres*: ${manga.genres.map((genre) => genre.name).join(", ") || "No genres"}

*Score*: ${manga.score || "No score"}
*Members*: ${manga.members || "No data"}
*Favorites*: ${manga.favorites || "No data"}

*Link*: ${manga.url}
      `;

      await bot.sendMessage(msg.key.remoteJid, {
        caption: mangaInfo.trim(),
        image: { url: manga.images.jpg.image_url },
      });
    } catch (error) {
      console.error(error);
      return msg.reply(
        "There was an error while fetching the manga information."
      );
    }
  },
};
