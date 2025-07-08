const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

// Fungsi ini diadaptasi dari screaper.js
async function getYtAudio(url) {
    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    // Urutkan berdasarkan bitrate untuk mendapatkan kualitas terbaik
    audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate);

    if (audioFormats.length === 0) {
        throw new Error("Tidak ada format audio yang ditemukan.");
    }
    
    return {
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        url: audioFormats[0].url
    };
}


module.exports = {
  name: "ytmp3",
  alias: ["yta"],
  description: "Unduh audio dari link YouTube.",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url || !ytdl.validateURL(url)) {
      return msg.reply("❌ Masukkan URL YouTube yang valid.");
    }

    await msg.react("⏳");

    try {
      const audioInfo = await getYtAudio(url);
      const caption = `✅ Audio berhasil diunduh:\n*${audioInfo.title}*`;

      // Unduh ke buffer untuk stabilitas
      const buffer = await axios.get(audioInfo.url, { responseType: 'arraybuffer' });

      await bot.sendMessage(msg.from, { 
          audio: buffer.data, 
          mimetype: 'audio/mpeg',
          caption: caption 
      }, { quoted: msg });

      await msg.react("✅");

    } catch (err) {
      console.error("Proses unduh ytmp3 gagal:", err);
      await msg.react("⚠️");
      return msg.reply(`❌ Gagal mengunduh audio.\n\n*Alasan:* ${err.message}`);
    }
  },
};