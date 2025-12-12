import axios from "axios";
import type { WASocket } from "baileys";

export default {
    name: "anime",
    description: "Get anime information from Jikan API",
    group: false,
    private: false,
    execute: async (msg: any, { args, bot }: { args: string[], bot: WASocket }) => {
        if (args.length === 0) {
            return msg.reply("Please provide the name of the anime!");
        }

        const animeName = args.join(" ");

        try {
            msg.react("⏳");
            const response = await axios.get(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
                    animeName
                )}&limit=1`
            );
            const anime = response.data.data[0];

            if (!anime) {
                msg.react("⚠️").then(() => {
                    msg.reply("Sorry, I couldn't find any anime with that name.");
                });
            }
            msg.react("✅");
            const animeInfo = `
*Title*: ${anime.title}
*English Title*: ${anime.title_english || "N/A"}
*Japanese Title*: ${anime.title_japanese || "N/A"}
*Synopsis*: ${anime.synopsis || "No description available."}
*Rating*: ${anime.rating || "No rating"}
*Episodes*: ${anime.episodes || "Unknown"}
*Status*: ${anime.status}
*Aired*: ${anime.aired.string}
*Genres*: ${anime.genres.map((genre: any) => genre.name).join(", ") || "No genres"}

*Score*: ${anime.score || "No score"}
*Members*: ${anime.members || "No data"}
*Favorites*: ${anime.favorites || "No data"}

*Link*: ${anime.url}
      `;

            await bot.sendMessage(msg.key.remoteJid, {
                image: { url: anime.images.jpg.image_url },
                caption: animeInfo.trim(),
            });
        } catch (error) {
            console.error(error);
            return msg.reply(
                "There was an error while fetching the anime information."
            );
        }
    },
};
