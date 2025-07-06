const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { parse } = require("node-html-parser");

const TEMP = path.join(__dirname, "../../temp");
const COOKIE = path.join(__dirname, "../../lib/cookies.txt");

if (!fs.existsSync(TEMP)) {
  fs.mkdirSync(TEMP, { recursive: true });
}

function downloadWithYtDlp(url, filename, useCookies = false) {
  const output = path.join(TEMP, filename);
  return new Promise((resolve, reject) => {
    const outputTemplate = output.replace(/\.[^/.]+$/, "");

    let cmd = `yt-dlp --no-warnings --no-playlist`;

    if (useCookies && fs.existsSync(COOKIE)) {
      cmd += ` --cookies "${COOKIE}"`;
    }

    // Perbaikan khusus untuk Instagram
    if (url.includes('instagram.com')) {
      cmd += ` --write-info-json`;
      cmd += ` --write-thumbnail`;
      cmd += ` --convert-thumbnails jpg`;
      cmd += ` -f "best[ext=mp4]/best[ext=jpg]/best"`;
      cmd += ` --yes-playlist`; // Penting untuk carousel
    }

    cmd += ` -o "${outputTemplate}.%(ext)s" "${url}"`;
    console.log(`Executing: ${cmd}`);

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }

      const files = fs.readdirSync(TEMP).filter(file =>
        file.startsWith(path.basename(outputTemplate)) &&
        /\.(mp4|jpg|jpeg|png|webp|json)$/i.test(file)
      );

      const mediaFiles = files.filter(f => !/\.json$/i.test(f));
      const jsonFiles = files.filter(f => /\.json$/i.test(f));

      if (mediaFiles.length === 0 && jsonFiles.length === 0) {
        return reject(new Error("File tidak ditemukan setelah download"));
      }

      // Return info tentang files yang berhasil didownload
      resolve({
        mediaFiles: mediaFiles.map(f => path.join(TEMP, f)),
        jsonFiles: jsonFiles.map(f => path.join(TEMP, f)),
        outputDir: TEMP,
        basename: path.basename(outputTemplate)
      });
    });
  });
}

function detectPlatform(url) {
  const normalizedUrl = url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^m\./, '');

  if (normalizedUrl.includes('instagram.com') || normalizedUrl.includes('instagr.am')) return 'instagram';
  if (normalizedUrl.includes('tiktok.com') || normalizedUrl.includes('vm.tiktok.com')) return 'tiktok';
  if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.com') || normalizedUrl.includes('fb.watch')) return 'facebook';
  if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) return 'twitter';

  return 'unknown';
}

// Instagram API scraping dengan multiple endpoints
async function fetchInstagramData(url) {
  const shortcodeMatch = url.match(/\/p\/([a-zA-Z0-9_-]+)|\/reel\/([a-zA-Z0-9_-]+)/);
  if (!shortcodeMatch) throw new Error("Invalid Instagram URL");

  const shortcode = shortcodeMatch[1] || shortcodeMatch[2];

  // Prioritaskan yt-dlp terlebih dahulu
  try {
    const tempFilename = `ig_temp_${Date.now()}`;
    const ytDlpResult = await downloadWithYtDlp(url, tempFilename, true);

    if (ytDlpResult.mediaFiles.length > 0) {
      // Jika yt-dlp berhasil, proses hasilnya
      const result = { images: [], videos: [] };

      for (const file of ytDlpResult.mediaFiles) {
        if (file.endsWith('.mp4')) {
          result.videos.push({ url: file });
        } else if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
          result.images.push(file);
        }
      }

      return result;
    }
  } catch (e) {
    console.log("yt-dlp approach failed, falling back to scraping");
  }

  // Jika yt-dlp gagal, coba scraping
  const methods = [
    () => fetchIgViaGraphQL(shortcode),
    () => fetchIgViaWebAPI(shortcode),
    () => fetchIgViaOEmbed(url),
    () => fetchIgViaScraping(url)
  ];

  for (const method of methods) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 detik
      const result = await method();
      if (result && (result.images.length > 0 || result.videos.length > 0)) {
        return result;
      }
    } catch (e) {
      console.log(`IG method failed: ${e.message}`);
      continue;
    }
  }

  return { images: [], videos: [] };
}

// Method 1: GraphQL endpoint (paling reliable untuk carousel)
async function fetchIgViaGraphQL(shortcode) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-IG-App-ID': '936619743392459', // Penting untuk akses API
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Gunakan endpoint terbaru
    const endpoint = `https://www.instagram.com/api/v1/media/shortcode/${shortcode}/`;

    const response = await axios.get(endpoint, {
      headers,
      withCredentials: true
    });

    const media = response.data.items?.[0] || response.data;
    const result = { images: [], videos: [] };

    // Handle carousel
    if (media.carousel_media) {
      for (const item of media.carousel_media) {
        if (item.media_type === 1) { // Image
          const bestImage = item.image_versions2?.candidates?.[0]?.url ||
            item.image_versions2?.candidates?.[1]?.url;
          if (bestImage) {
            result.images.push(bestImage.replace(/\?.*$/, '')); // Hapus query string
          }
        } else if (item.media_type === 2) { // Video
          const bestVideo = item.video_versions?.[0]?.url;
          const thumbnail = item.image_versions2?.candidates?.[0]?.url;
          if (bestVideo) {
            result.videos.push({
              url: bestVideo.replace(/\?.*$/, ''),
              thumbnail: thumbnail?.replace(/\?.*$/, '')
            });
          }
        }
      }
    }
    // Handle single media
    else if (media.media_type === 1) {
      const bestImage = media.image_versions2?.candidates?.[0]?.url ||
        media.image_versions2?.candidates?.[1]?.url;
      if (bestImage) {
        result.images.push(bestImage.replace(/\?.*$/, ''));
      }
    } else if (media.media_type === 2) {
      const bestVideo = media.video_versions?.[0]?.url;
      const thumbnail = media.image_versions2?.candidates?.[0]?.url;
      if (bestVideo) {
        result.videos.push({
          url: bestVideo.replace(/\?.*$/, ''),
          thumbnail: thumbnail?.replace(/\?.*$/, '')
        });
      }
    }

    return result;
  } catch (e) {
    throw new Error(`GraphQL method failed: ${e.message}`);
  }
}

// Method 2: Web API dengan session
async function fetchIgViaWebAPI(shortcode) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const response = await axios.get(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, { headers });

    if (response.data && response.data.items) {
      const media = response.data.items[0];
      const result = { images: [], videos: [] };

      if (media.carousel_media) {
        for (const item of media.carousel_media) {
          if (item.media_type === 1) {
            result.images.push(item.image_versions2.candidates[0].url);
          } else if (item.media_type === 2) {
            result.videos.push({
              url: item.video_versions[0].url,
              thumbnail: item.image_versions2.candidates[0].url
            });
          }
        }
      } else {
        if (media.media_type === 1) {
          result.images.push(media.image_versions2.candidates[0].url);
        } else if (media.media_type === 2) {
          result.videos.push({
            url: media.video_versions[0].url,
            thumbnail: media.image_versions2.candidates[0].url
          });
        }
      }

      return result;
    }

    throw new Error("No data from Web API");
  } catch (e) {
    throw new Error(`Web API method failed: ${e.message}`);
  }
}

// Method 3: oEmbed (backup)
async function fetchIgViaOEmbed(url) {
  try {
    const response = await axios.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`);

    if (response.data && response.data.thumbnail_url) {
      return {
        images: [response.data.thumbnail_url],
        videos: []
      };
    }

    throw new Error("No oEmbed data");
  } catch (e) {
    throw new Error(`oEmbed method failed: ${e.message}`);
  }
}

// Method 4: HTML Scraping (last resort)
async function fetchIgViaScraping(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    const result = { images: [], videos: [] };

    // Cari JSON data dalam script tags
    const scriptMatches = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/g);

    if (scriptMatches) {
      for (const match of scriptMatches) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonStr);

          if (data.image) {
            if (Array.isArray(data.image)) {
              result.images.push(...data.image);
            } else {
              result.images.push(data.image);
            }
          }

          if (data.video && data.video.contentUrl) {
            result.videos.push({
              url: data.video.contentUrl,
              thumbnail: data.video.thumbnailUrl || data.image
            });
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Fallback: cari meta tags
    if (result.images.length === 0) {
      const root = parse(html);
      const ogImage = root.querySelector('meta[property="og:image"]');
      if (ogImage) {
        result.images.push(ogImage.getAttribute('content'));
      }
    }

    return result;
  } catch (e) {
    throw new Error(`Scraping method failed: ${e.message}`);
  }
}

// Facebook enhanced scraping
async function fetchFacebookData(url) {
  const methods = [
    () => fetchFbViaMetaTags(url),
    () => fetchFbViaEmbedScraping(url)
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result && result.images && result.images.length > 0) {
        return result;
      }
    } catch (e) {
      console.log(`FB method failed: ${e.message}`);
      continue;
    }
  }

  return { images: [], videos: [] };
}

async function fetchFbViaMetaTags(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const root = parse(response.data);
    const result = { images: [], videos: [] };

    // Cari berbagai meta tags untuk gambar HD
    const metaSelectors = [
      'meta[property="og:image"]',
      'link[rel="image_src"]',
      'meta[property="instagram:media"]',
      'meta[name="twitter:image"]',
    ];

    for (const selector of metaSelectors) {
      const metas = root.querySelectorAll(selector);
      metas.forEach(meta => {
        const content = meta.getAttribute('content');
        if (content && !result.images.includes(content)) {
          // Coba dapatkan versi HD dengan memodifikasi URL
          const hdUrl = content.replace(/s\d+x\d+/, 's0').replace(/c\d+\.\d+\.\d+\.\d+/, 'c0.0.0.0');
          result.images.push(hdUrl);
        }
      });
    }

    return result;
  } catch (e) {
    throw new Error(`FB meta tags failed: ${e.message}`);
  }
}

async function fetchFbViaEmbedScraping(url) {
  try {
    // Coba akses versi mobile untuk data yang lebih mudah diparse
    const mobileUrl = url.replace('www.facebook.com', 'm.facebook.com');

    const response = await axios.get(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const root = parse(response.data);
    const result = { images: [], videos: [] };

    // Cari gambar dengan berbagai selector
    const imgSelectors = [
      'img[src*="scontent"]',
      'img[src*="fbcdn"]',
      'img[data-src*="scontent"]',
      'img[data-src*="fbcdn"]',
      'div[data-ft] img'
    ];

    for (const selector of imgSelectors) {
      const imgs = root.querySelectorAll(selector);
      imgs.forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src && src.includes('scontent') && !result.images.includes(src)) {
          // Modifikasi URL untuk mendapatkan resolusi penuh
          const fullSizeUrl = src.replace(/p\d+x\d+/, 'p0').replace(/s\d+x\d+/, 's0');
          result.images.push(fullSizeUrl);
        }
      });
    }

    return result;
  } catch (e) {
    throw new Error(`FB embed scraping failed: ${e.message}`);
  }
}

// Download image/video dari URL
async function downloadMediaFromUrl(mediaUrl, filename, isVideo = false) {
  try {
    const response = await axios.get(mediaUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': isVideo ? 'video/*' : 'image/*'
      }
    });

    const filePath = path.join(TEMP, filename);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (e) {
    throw new Error(`Download failed: ${e.message}`);
  }
}

module.exports = {
  name: "downm",
  description: "Unduh media dari Instagram, TikTok, Facebook, Twitter dengan dukungan penuh untuk carousel/multiple images.",
  execute: async (msg, { args, bot }) => {
    const url = args[0];
    if (!url) return msg.reply("❌ Masukkan URL media.\n\nContoh: .downm https://instagram.com/p/xxxxx");

    if (!url.match(/^https?:\/\//)) {
      return msg.reply("❌ URL harus dimulai dengan http:// atau https://");
    }

    const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      return msg.reply("❌ Untuk YouTube gunakan command: *.yt*");
    }

    msg.react("⏳");
    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return msg.reply("❌ Platform tidak didukung. Bot mendukung: Instagram, TikTok, Facebook, Twitter/X.");
    }

    try {
      const filename = `${platform}_${Date.now()}`;
      const useCookies = ['instagram', 'facebook'].includes(platform) && fs.existsSync(COOKIE);

      // Coba yt-dlp terlebih dahulu untuk video
      let ytDlpSuccess = false;
      try {
        const result = await downloadWithYtDlp(url, filename, useCookies);

        if (result.mediaFiles && result.mediaFiles.length > 0) {
          // Berhasil dengan yt-dlp
          for (const filePath of result.mediaFiles) {
            const fileStats = fs.statSync(filePath);
            if (fileStats.size > 64 * 1024 * 1024) {
              fs.unlinkSync(filePath);
              continue;
            }

            const ext = path.extname(filePath).toLowerCase();
            const caption = `✅ Konten dari ${platform} berhasil diunduh (yt-dlp)`;

            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
              await bot.sendMessage(msg.from, {
                image: fs.readFileSync(filePath),
                caption
              }, { quoted: msg });
            } else {
              await bot.sendMessage(msg.from, {
                video: fs.readFileSync(filePath),
                caption
              }, { quoted: msg });
            }

            fs.unlinkSync(filePath);
          }

          // Cleanup JSON files
          if (result.jsonFiles) {
            result.jsonFiles.forEach(jsonFile => {
              if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
            });
          }

          ytDlpSuccess = true;
        }
      } catch (ytDlpError) {
        console.error("yt-dlp gagal:", ytDlpError.message);
      }

      // Jika yt-dlp gagal atau tidak ada media files, coba scraping
      if (!ytDlpSuccess) {
        let mediaData = { images: [], videos: [] };

        if (platform === 'instagram') {
          msg.reply("⚠️ yt-dlp gagal. Mencoba scraping Instagram dengan metode advanced...");
          mediaData = await fetchInstagramData(url);
        } else if (platform === 'facebook') {
          msg.reply("⚠️ yt-dlp gagal. Mencoba scraping Facebook...");
          mediaData = await fetchFacebookData(url);
        }

        if (mediaData.images.length === 0 && mediaData.videos.length === 0) {
          throw new Error("Tidak ada media ditemukan dari semua metode");
        }

        let mediaCount = 0;
        const totalMedia = mediaData.images.length + mediaData.videos.length;

        // Download dan kirim images
        for (let i = 0; i < mediaData.images.length; i++) {
          try {
            const imageFilename = `${platform}_image_${Date.now()}_${i}.jpg`;
            const imagePath = await downloadMediaFromUrl(mediaData.images[i], imageFilename, false);

            mediaCount++;
            await bot.sendMessage(msg.from, {
              image: fs.readFileSync(imagePath),
              caption: `✅ Gambar ${mediaCount}/${totalMedia} dari ${platform} (scraping)`
            }, { quoted: msg });

            fs.unlinkSync(imagePath);
          } catch (downloadError) {
            console.error(`Error downloading image ${i + 1}:`, downloadError.message);
            continue;
          }
        }

        // Download dan kirim videos
        for (let i = 0; i < mediaData.videos.length; i++) {
          try {
            const videoFilename = `${platform}_video_${Date.now()}_${i}.mp4`;
            const videoPath = await downloadMediaFromUrl(mediaData.videos[i].url, videoFilename, true);

            mediaCount++;
            await bot.sendMessage(msg.from, {
              video: fs.readFileSync(videoPath),
              caption: `✅ Video ${mediaCount}/${totalMedia} dari ${platform} (scraping)`
            }, { quoted: msg });

            fs.unlinkSync(videoPath);
          } catch (downloadError) {
            console.error(`Error downloading video ${i + 1}:`, downloadError.message);
            continue;
          }
        }
      }

      msg.react("✅");

    } catch (err) {
      console.error("Semua metode gagal:", err.message);
      msg.react("⚠️");
      return msg.reply("❌ Gagal mengunduh media dari semua metode yang tersedia.");
    }
  }
};