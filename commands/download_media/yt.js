const { exec, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEMP = path.join(__dirname, "../../temp");
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

function getInfo(url) {
  try {
    const raw = execSync(`yt-dlp -j --no-cache-dir "${url}"`, { encoding: "utf-8" });
    const json = JSON.parse(raw);
    return {
      title: json.title,
      duration: formatDuration(json.duration),
      channel: json.uploader,
      thumbnail: json.thumbnail,
      formats: json.formats.map(f => ({
        id: f.format_id,
        ext: f.ext,
        res: f.resolution || `${f.height}p`,
        fps: f.fps || "",
        acodec: f.acodec,
        vcodec: f.vcodec,
        filesize: f.filesize
      }))
    };
  } catch (e) {
    console.error("yt-dlp info error:", e);
    return null;
  }
}

function downloadYt(url, format, type, filename) {
  const output = path.join(TEMP, filename);
  return new Promise((resolve, reject) => {
    const isVideo = type === "video";
    const cmd = isVideo
      ? `yt-dlp --no-cache-dir -f "${format}+bestaudio/best" -o "${output}" "${url}" --no-playlist`
      : `yt-dlp --no-cache-dir -f "${format}" -o "${output}" "${url}" --no-playlist`;

    exec(cmd, (err) => {
      if (err || !fs.existsSync(output)) return reject("❌ Gagal mengunduh.");
      resolve(output);
    });
  });
}

function removeDuplicateFormats(formats) {
  const seen = new Set();
  return formats.filter(f => {
    const key = `${f.res}-${f.fps}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  name: "yt",
  description: "Unduh video/audio dari YouTube",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url) return msg.reply("❌ Kirim link YouTube.\nContoh: `.yt https://youtube.com/watch?v=xxxxx`");

    // Handle unduh
    if (args[0]?.startsWith("id=")) {
      const [_, formatId, encodedUrl, type] = args[0].split(";");
      const realUrl = decodeURIComponent(encodedUrl);
      const ext = type === "audio" ? "mp3" : "mp4";
      const filename = `yt_${Date.now()}.${ext}`;

      try {
        const file = await downloadYt(realUrl, formatId, type, filename);
        await bot.sendMessage(msg.from, {
          document: fs.readFileSync(file),
          mimetype: ext === "mp3" ? "audio/mpeg" : "video/mp4",
          fileName: filename
        }, { quoted: msg });
        fs.unlinkSync(file);
        return msg.react("✅");
      } catch (e) {
        console.error(e);
        return msg.reply("❌ Gagal mengunduh media.");
      }
    }

    // Ambil info video
    const info = getInfo(url);
    if (!info) return msg.reply("❌ Gagal mengambil informasi video.");

    await bot.sendMessage(msg.from, {
      image: { url: info.thumbnail },
      caption: `📺 *${info.title}*\n👤 ${info.channel}\n🕒 ${info.duration}`
    }, { quoted: msg });

    // Pilihan kualitas
    const videoFormats = removeDuplicateFormats(
      info.formats.filter(f => f.vcodec !== "none" && f.ext === "mp4")
    ).sort((a, b) => parseInt(a.res) - parseInt(b.res)); // urut dari rendah

    const audioFormats = info.formats.filter(f => f.vcodec === "none" && f.ext === "m4a");

    let output = `🎚 *Pilih kualitas untuk diunduh:*\n\n`;

    videoFormats.forEach(v => {
      output += `🎞️ *${v.res} ${v.fps}fps*\n┗ 📥 \`.yt id=${v.id};${encodeURIComponent(url)};video\`\n\n`;
    });

    audioFormats.slice(0, 2).forEach(a => {
      output += `🎵 *Audio MP3*\n┗ 📥 \`.yt id=${a.id};${encodeURIComponent(url)};audio\`\n\n`;
    });

    output += "📝 Salin atau reply salah satu baris di atas untuk mulai unduhan.";
    await msg.reply(output);
  }
};
