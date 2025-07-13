const axios = require('axios');
const cheerio = require('cheerio');

// Fungsi untuk memilih elemen secara acak dari sebuah array
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Fungsi utama untuk mencari di Pinterest
async function pinterestSearch(query) {
  try {
    const response = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`);
    const $ = cheerio.load(response.data);
    
    const results = [];
    $('div[data-test-id="pin-visual-wrapper"] img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.startsWith('https://i.pinimg.com')) {
        results.push(src);
      }
    });

    return results;
  } catch (error) {
    console.error("Gagal melakukan scraping dari Pinterest:", error);
    return [];
  }
}

// Fungsi untuk video (saat ini belum didukung karena kompleksitas scraping video)
// Untuk sementara, kita akan tetap mencari gambar
async function pinterestVideoSearch(query) {
    // Logika scraping video lebih kompleks dan sering berubah.
    // Untuk stabilitas, fitur ini akan mencari gambar untuk saat ini.
    // Di masa depan, ini bisa dikembangkan lebih lanjut dengan API atau metode yang lebih canggih.
    return pinterestSearch(query);
}


module.exports = {
  name: "pin",
  alias: ["pinterest"],
  description: "Mencari gambar dari Pinterest.",
  category: "tools",
  execute: async (msg, { bot, args, usedPrefix, command }) => {
    // Menampilkan pesan bantuan jika tidak ada query
    if (!args.length) {
      const helpMessage = `*Pencarian Pinterest* 🔎\n\nFitur ini digunakan untuk mencari gambar dari Pinterest.\n\n*Cara Penggunaan:*\n\`${usedPrefix + command} <query>\`\nContoh: \`${usedPrefix + command} cyberpunk city\`\n\n*Opsi Tambahan:*\n- \`-j <jumlah>\`: Untuk mengirim beberapa gambar sekaligus (maksimal 5).\n  Contoh: \`${usedPrefix + command} cat -j 3\`\n\n- \`-v\`: Untuk mencoba mencari video (fitur eksperimental).\n  Contoh: \`${usedPrefix + command} aesthetic scenery -v\``;
      return bot.sendMessage(msg.from, { text: helpMessage }, { quoted: msg });
    }

    // --- Parsing Argumen ---
    let query = [];
    let count = 1;
    let searchVideos = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i].toLowerCase() === '-j') {
        // Mengambil jumlah gambar, batasi maksimal 5
        count = parseInt(args[i + 1], 10);
        if (isNaN(count) || count < 1) {
          count = 1;
        } else if (count > 5) {
          count = 5;
          msg.reply("Jumlah maksimal yang diizinkan adalah 5.");
        }
        i++; // Lewati angka setelah -j
      } else if (args[i].toLowerCase() === '-v') {
        searchVideos = true;
      } else {
        query.push(args[i]);
      }
    }
    const searchQuery = query.join(' ');
    if (!searchQuery) return msg.reply("Mohon masukkan query pencarian.");

    try {
        await msg.react("⏳"); // Memberi reaksi tunggu

        // Memilih fungsi pencarian berdasarkan flag -v
        const searchFunction = searchVideos ? pinterestVideoSearch : pinterestSearch;
        const results = await searchFunction(searchQuery);

        if (!results.length) {
            await msg.react("❌");
            return msg.reply("Maaf, tidak ada hasil yang ditemukan untuk query tersebut.");
        }

        // Mengirim gambar sesuai jumlah yang diminta
        for (let i = 0; i < count; i++) {
            const randomImage = pickRandom(results);
            if (randomImage) {
                // Untuk video, Baileys akan otomatis menampilkannya sebagai video jika linknya adalah video
                await bot.sendMessage(msg.from, { image: { url: randomImage }, caption: `Hasil pencarian untuk: *${searchQuery}*` }, { quoted: msg });
            }
        }

        await msg.react("✅"); // Reaksi sukses

    } catch (error) {
        console.error("Error pada perintah Pinterest:", error);
        await msg.react("❌");
        msg.reply("Terjadi kesalahan saat memproses permintaan Anda.");
    }
  },
};