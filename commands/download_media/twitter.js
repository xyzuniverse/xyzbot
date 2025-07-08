const { Scraper } = require('@the-convocation/twitter-scraper');
const axios = require("axios");

/**
 * =================================================================
 * FUNGSI X/Twitter Downloader dengan Statistik Lengkap
 * =================================================================
 * Menambahkan pengambilan dan format data statistik tweet dan
 * informasi penulis.
 */
async function twitterDl(url) {
    const scraper = new Scraper();
    
    const match = url.match(/\/status\/(\d+)/);
    if (!match) {
        throw new Error("URL Tweet tidak valid.");
    }
    const tweetId = match[1];

    try {
        const tweet = await scraper.getTweet(tweetId);

        if (!tweet) {
            throw new Error("Tweet tidak ditemukan atau privat.");
        }

        const mediaItems = [];
        
        if (tweet.photos && tweet.photos.length > 0) {
            tweet.photos.forEach(photo => {
                mediaItems.push({ type: 'image', url: photo.url });
            });
        }

        if (tweet.videos && tweet.videos.length > 0) {
            tweet.videos.forEach(video => {
                let videoUrl;
                if (video.variants && Array.isArray(video.variants) && video.variants.length > 0) {
                    const bestVariant = video.variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
                    videoUrl = bestVariant.url;
                } else if (video.url) {
                    videoUrl = video.url;
                }
                if (videoUrl) {
                    mediaItems.push({ type: 'video', url: videoUrl });
                }
            });
        }
        
        if (mediaItems.length === 0) {
            throw new Error("Tweet ini tidak mengandung media (gambar/video).");
        }

        // --- PENGAMBILAN DATA STATISTIK & AUTHOR ---
        return {
            text: tweet.text,
            author: {
                name: tweet.name,
                username: tweet.username
            },
            stats: {
                views: tweet.views,
                likes: tweet.likes,
                reposts: tweet.retweets,
                replies: tweet.replies
            },
            media: mediaItems
        };

    } catch (e) {
        throw new Error(`Scraper gagal: ${e.message}`);
    }
}

// Fungsi untuk memformat angka menjadi lebih ringkas (misal: 1500 -> 1.5K)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

module.exports = {
  name: "x",
  alias: ["twt", "twitter"],
  description: "Unduh media dari X/Twitter dengan statistik lengkap.",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url || (!url.includes("twitter.com") && !url.includes("x.com"))) {
      return msg.reply("❌ Masukkan URL X/Twitter yang valid.");
    }

    await msg.react("⏳");

    try {
      const result = await twitterDl(url);

      if (!result || result.media.length === 0) {
        throw new Error("Gagal mengekstrak media.");
      }

      // --- MEMBUAT CAPTION DENGAN STATISTIK ---
      let baseCaption = `*${result.author.name}* (@${result.author.username})\n\n`;
      if (result.text) {
          baseCaption += `${result.text}\n\n`;
      }
      baseCaption += `❤️ ${formatNumber(result.stats.likes)} 🔁 ${formatNumber(result.stats.reposts)} 💬 ${formatNumber(result.stats.replies)} 👀 ${formatNumber(result.stats.views)}`;

      await msg.reply(`${baseCaption}\n\n✅ Berhasil mendapatkan ${result.media.length} media. Mengirim...`);

      for (const [index, item] of result.media.entries()) {
        try {
            const response = await axios.get(item.url, { responseType: 'arraybuffer' });
            const buffer = response.data;
            
            // Hanya kirim caption untuk item pertama
            const itemCaption = (index === 0) ? baseCaption : "";
            
            if (item.type === 'video') {
                await bot.sendMessage(msg.from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg });
            } else {
                await bot.sendMessage(msg.from, { image: buffer, mimetype: 'image/jpeg' }, { quoted: msg });
            }
        } catch (sendError) {
          console.error(`Gagal mengirim media dari URL: ${item.url}`, sendError);
          await msg.reply(`⚠️ Gagal mengirim media ${index + 1}.`);
        }
      }

      await msg.react("✅");

    } catch (err) {
      console.error("Proses unduh .x gagal:", err);
      await msg.react("⚠️");
      return msg.reply(`❌ Gagal mengunduh media.\n\n*Alasan:* ${err.message}`);
    }
  },
};