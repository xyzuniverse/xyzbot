const ytdl = require('@distube/ytdl-core');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Fungsi untuk mendapatkan info video
async function getYtInfo(url) {
    const info = await ytdl.getInfo(url);
    // Filter video-saja (mp4) dan audio-saja (m4a/mp4)
    const videoFormats = ytdl.filterFormats(info.formats, 'videoonly').filter(f => f.container === 'mp4');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (videoFormats.length === 0 || audioFormats.length === 0) {
        throw new Error("Tidak ada format video/audio terpisah yang ditemukan (diperlukan untuk kualitas HD).");
    }
    return { info, videoFormats, audioFormats };
}

// Fungsi untuk menggabungkan video dan audio dengan FFmpeg
function mergeVideoAudio(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
        const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac "${outputPath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('FFmpeg Error:', stderr);
                return reject(new Error(`Gagal menggabungkan file: ${stderr}`));
            }
            resolve(outputPath);
        });
    });
}

module.exports = {
  name: "ytmp4",
  alias: ["ytv"],
  description: "Unduh video dari YouTube dengan pilihan kualitas HD.",
  execute: async (msg, { args, bot, usedPrefix, command }) => {
    const url = args[0];
    const quality = args[1];

    if (!url || !ytdl.validateURL(url)) {
      return msg.reply("❌ Masukkan URL YouTube yang valid.");
    }

    await msg.react("⏳");

    try {
        const { info, videoFormats } = await getYtInfo(url);
        const videoTitle = info.videoDetails.title;
        const thumbnailUrl = info.videoDetails.thumbnails.slice(-1)[0].url;

        if (!quality) {
            const uniqueQualities = [...new Set(videoFormats.map(f => f.qualityLabel))];
            let qualityList = "Kualitas HD ditemukan! Silakan pilih salah satu:\n";
            uniqueQualities.forEach(q => {
                qualityList += `\`☞ ${q}\`\n`;
            });
            
            await bot.sendMessage(msg.from, {
                image: { url: thumbnailUrl },
                caption: `*${videoTitle}*\n\n${qualityList}` + "Pilih kualitas dengan mengetik *.ytmp4* + link + kualitas\nContoh :.ytmp4 https://www.youtube.com/watch?v=XxXXxxx 1080p"
            }, { quoted: msg });
            
            await msg.react("");
            return;
        }
        
        const selectedVideo = videoFormats.find(f => f.qualityLabel === quality);
        if (!selectedVideo) {
            await msg.react("⚠️");
            return msg.reply(`❌ Kualitas "${quality}" tidak ditemukan.`);
        }

        const { audioFormats } = await getYtInfo(url); // panggil lagi untuk audio
        const bestAudio = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

        await msg.reply(`✅ Mengunduh video *(${quality})* dan audio... Ini mungkin memakan waktu.`);

        const timestamp = Date.now();
        const videoPath = path.join(TEMP_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(TEMP_DIR, `audio_${timestamp}.m4a`);
        const outputPath = path.join(TEMP_DIR, `output_${timestamp}.mp4`);

        // Unduh kedua file
        const videoStream = (await axios.get(selectedVideo.url, { responseType: 'stream' })).data;
        const audioStream = (await axios.get(bestAudio.url, { responseType: 'stream' })).data;
        
        await Promise.all([
            new Promise(resolve => videoStream.pipe(fs.createWriteStream(videoPath)).on('finish', resolve)),
            new Promise(resolve => audioStream.pipe(fs.createWriteStream(audioPath)).on('finish', resolve))
        ]);

        await msg.reply("Menggabungkan video dan audio dengan FFmpeg...");

        // Gabungkan file
        await mergeVideoAudio(videoPath, audioPath, outputPath);

        await bot.sendMessage(msg.from, { 
            video: fs.readFileSync(outputPath),
            mimetype: 'video/mp4',
            caption: `✅ Video berhasil diunduh:\n*${videoTitle}*`
        }, { quoted: msg });

        await msg.react("✅");

        // Hapus semua file sementara
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outputPath);

    } catch (err) {
      console.error("Proses unduh ytmp4 gagal:", err);
      await msg.react("⚠️");
      return msg.reply(`❌ Gagal memproses video.\n\n*Alasan:* Pastikan FFmpeg terinstal di server. Pesan error: ${err.message}`);
    }
  },
};