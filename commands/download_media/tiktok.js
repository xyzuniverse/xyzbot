const axios = require("axios");

/**
 * =================================================================
 * FUNGSI TIKTOK DOWNLOADER BERDASARKAN KODE REFERENSI
 * =================================================================
 * Mengimplementasikan logika dari fungsi tiktokDl yang sudah
 * terbukti berhasil.
 */
async function tiktokDl(url) {
    try {
        const response = await axios.post('https://www.tikwm.com/api/', {}, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            },
            params: {
                url: url,
                hd: 1 // Meminta kualitas HD
            }
        });

        const res = response.data.data;

        if (!res) {
            throw new Error('Respons API tidak valid atau tidak berisi data.');
        }

        const media = [];
        // Cek jika ini adalah slideshow gambar
        if (res.images && res.images.length > 0) {
            res.images.forEach(imgUrl => {
                media.push({ type: 'image', url: imgUrl });
            });
        } 
        // Jika bukan, ini adalah video
        else if (res.play) {
            media.push({ type: 'video', url: res.hdplay || res.play }); // Prioritaskan HD
        } else {
             throw new Error('Tidak ada media video atau gambar yang ditemukan dalam respons API.');
        }

        return {
            title: res.title,
            author: res.author.unique_id,
            nickname: res.author.nickname,
            durations: res.duration,
            duration: res.duration + ' Detik',
            media: media
        };

    } catch (e) {
        const errorMessage = e.response ? e.response.data.msg : e.message;
        throw new Error(`API tikwm.com gagal: ${errorMessage}`);
    }
}


module.exports = {
  name: "tt",
  description: "Unduh media dari TikTok (video atau slideshow gambar).",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url || !url.includes("tiktok.com")) {
      return msg.reply("❌ Masukkan URL TikTok yang valid.");
    }

    await msg.react("⏳");

    try {
      const result = await tiktokDl(url);
      const caption = `🎞Caption: *${result.title}*\n  ⏳Duration: *${result.duration}*\n  💁🏼‍♀️Author: ${result.author}(@${result.nickname})`;

      if (result.media.length > 0) {
        await msg.reply(`✅ Berhasil mendapatkan ${result.media.length} media. Mengirim...`);

        for (const [index, item] of result.media.entries()) {
          const itemCaption = `${caption}\n(${index + 1}/${result.media.length})`;
          if (item.type === 'video') {
            await bot.sendMessage(msg.from, { video: { url: item.url }, caption: itemCaption }, { quoted: msg });
          } else {
            await bot.sendMessage(msg.from, { image: { url: item.url }, caption: itemCaption }, { quoted: msg });
          }
        }
      } else {
        throw new Error("Tidak ada media yang bisa diunduh.");
      }

      await msg.react("✅");

    } catch (err) {
      console.error("Proses unduh TikTok gagal:", err);
      await msg.react("⚠️");
      return msg.reply(`❌ Gagal mengunduh media.\n\n*Alasan:* ${err.message}`);
    }
  },
};