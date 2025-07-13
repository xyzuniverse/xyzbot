const axios = require('axios');

// Fungsi untuk memilih elemen secara acak dari sebuah array
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Fungsi utama untuk mencari di Pinterest menggunakan API internal
async function pinterestSearch(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get('https://www.pinterest.com/resource/BaseSearchResource/get/', {
        headers: { // Header untuk meniru permintaan dari browser
          'accept': 'application/json, text/javascript, */*, q=0.01',
          'accept-language': 'en-US,en;q=0.9',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest'
        },
        params: {
          source_url: `/search/pins/?q=${query}`,
          data: JSON.stringify({
            options: { query, scope: "pins" },
            context: {},
          }),
        },
      });
      
      // Mengambil hasil dari respons JSON
      const results = data.resource_response?.data?.results;
      if (results && results.length > 0) {
        // Menyaring dan mengambil URL gambar berkualitas tinggi
        const imageUrls = results.map(item => item.images?.['736x']?.url).filter(url => url);
        resolve(imageUrls);
      } else {
        resolve([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari API Pinterest:", error.message);
      reject([]);
    }
  });
}

// Fungsi video akan menggunakan metode yang sama, karena API tidak membedakannya secara langsung
async function pinterestVideoSearch(query) {
    return pinterestSearch(query);
}

module.exports = {
  name: "pin",
  alias: ["pinterest"],
  description: "Mencari gambar atau video dari Pinterest.",
  category: "tools",
  execute: async (msg, { bot, args, usedPrefix, command }) => {
    // Menampilkan pesan bantuan jika tidak ada query
    if (!args.length) {
      const helpMessage = `*Pencarian Pinterest* 🔎\n\nFitur ini digunakan untuk mencari media dari Pinterest.\n\n*Cara Penggunaan:*\n\`${usedPrefix + command} <query>\`\nContoh: \`${usedPrefix + command} cyberpunk city\`\n\n*Opsi Tambahan:*\n- \`-j <jumlah>\`: Untuk mengirim beberapa hasil sekaligus (maksimal 5).\n  Contoh: \`${usedPrefix + command} cat -j 3\`\n\n- \`-v\`: Untuk mencoba memprioritaskan pencarian video.\n  Contoh: \`${usedPrefix + command} aesthetic scenery -v\``;
      return bot.sendMessage(msg.from, { text: helpMessage }, { quoted: msg });
    }

    // --- Parsing Argumen ---
    let query = [];
    let count = 1;
    let searchVideos = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i].toLowerCase() === '-j') {
        count = parseInt(args[i + 1], 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 5) {
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
        await msg.react("⏳");

        const searchFunction = searchVideos ? pinterestVideoSearch : pinterestSearch;
        const results = await searchFunction(searchQuery);

        if (!results.length) {
            await msg.react("❌");
            return msg.reply("Maaf, tidak ada hasil yang ditemukan untuk query tersebut.");
        }

        for (let i = 0; i < count; i++) {
            const randomMedia = pickRandom(results);
            if (randomMedia) {
                // Baileys akan otomatis mengirim sebagai video jika linknya adalah video
                await bot.sendMessage(msg.from, { 
                    image: { url: randomMedia }, 
                    caption: `Hasil pencarian untuk: *${searchQuery}*` 
                }, { quoted: msg });
            }
        }

        await msg.react("✅");

    } catch (error) {
        console.error("Error pada perintah Pinterest:", error);
        await msg.react("❌");
        msg.reply("Terjadi kesalahan saat memproses permintaan Anda.");
    }
  },
};