const axios = require("axios");
const cheerio = require("cheerio");
const { fileTypeFromBuffer } = require("file-type"); // Menggunakan file-type jika tersedia

/**
 * =================================================================
 * FUNGSI IG Downloader Berdasarkan Repositori Hitori (nazedev)
 * =================================================================
 * Ini adalah implementasi ulang dari fungsi yang sudah terbukti
 * berhasil, menggunakan yt1s.io dan cheerio.
 */
async function instagramDl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            // Mengirim request POST persis seperti kode referensi
            const { data } = await axios.post('https://yt1s.io/api/ajaxSearch', new URLSearchParams({ q: url, vt: 'ig' }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Referer': 'https://yt1s.io/'
                }
            });

            // Memuat respons HTML ke cheerio untuk di-scrape
            const $ = cheerio.load(data.data);
            const result = [];
            
            // Mencari semua link unduhan
            const downloadLinks = $('a.abutton.is-success.is-fullwidth.btn-premium');

            if (downloadLinks.length === 0) {
                 throw new Error("Tidak ada link unduhan yang ditemukan dalam respons API. Postingan mungkin tidak valid atau API telah berubah.");
            }

            downloadLinks.each((i, element) => {
                const href = $(element).attr('href');
                if (href) {
                    result.push(href);
                }
            });

            resolve(result);

        } catch (e) {
            // Cek jika error berasal dari axios atau logika kita
            const errorMessage = e.response ? e.response.data : e.message;
            reject(new Error(`Gagal saat scraping dari yt1s.io: ${errorMessage}`));
        }
    });
}

module.exports = {
  name: "ig",
  description: "Unduh media dari Instagram menggunakan metode scraping.",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url || !url.includes("instagram.com")) {
      return msg.reply("❌ Masukkan URL Instagram yang valid.");
    }

    await msg.react("⏳");

    try {
      const mediaUrls = await instagramDl(url);
      
      if (!mediaUrls || mediaUrls.length === 0) {
          throw new Error("Gagal mengekstrak media dari link tersebut.");
      }

      await msg.reply(`✅ Berhasil mendapatkan ${mediaUrls.length} media. Mengirim...`);

      for (const [index, mediaUrl] of mediaUrls.entries()) {
        const caption = `✅ Media ${index + 1}/${mediaUrls.length}`;
        try {
            // Kita akan mengirimnya sebagai document untuk memastikan video dan gambar terkirim dengan benar
            const buffer = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const { mime } = await fileTypeFromBuffer(buffer.data) || { mime: 'application/octet-stream' };
            
            if (mime.startsWith('video/')) {
                 await bot.sendMessage(msg.from, { video: buffer.data, caption }, { quoted: msg });
            } else if (mime.startsWith('image/')) {
                 await bot.sendMessage(msg.from, { image: buffer.data, caption }, { quoted: msg });
            } else {
                 await bot.sendMessage(msg.from, { document: buffer.data, mimetype: mime, fileName: `media_${index + 1}` }, { quoted: msg });
            }
          
        } catch (sendError) {
            console.error(`Gagal mengirim media dari URL: ${mediaUrl}`, sendError);
            await msg.reply(`⚠️ Gagal mengirim media ${index + 1}. Mencoba mengirim sebagai file...`);
            // Fallback: Kirim sebagai file jika metode biasa gagal
            await bot.sendMessage(msg.from, { document: { url: mediaUrl }, fileName: `media_${index + 1}.bin`, caption: `${caption}\n(Dikirim sebagai file karena terjadi error)` }, { quoted: msg });
        }
      }

      await msg.react("✅");

    } catch (err) {
      console.error("Proses unduh gagal total:", err);
      await msg.react("⚠️");
      return msg.reply(`❌ Gagal mengunduh media.\n\n*Alasan:* ${err.message}`);
    }
  },
};