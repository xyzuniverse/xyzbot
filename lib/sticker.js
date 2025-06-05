// lib/sticker.js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function createStickerFromVideo(videoBuffer, options = {}) {
  const tempInputPath = path.join(__dirname, '../temp', 'vid_input.mp4');
  const tempOutputPath = path.join(__dirname, '../temp', 'vid_output.webp');

  fs.writeFileSync(tempInputPath, videoBuffer);

  return new Promise((resolve, reject) => {
    ffmpeg(tempInputPath)
      .duration(10) // potong durasi maksimal
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
        '-lossless', '0',
        '-compression_level', '6',
        '-qscale', '75',
        '-preset', 'default',
        '-loop', '0',
        '-an',
        '-vsync', '0'
      ])
      .save(tempOutputPath)
      .on('end', () => {
        const webpBuffer = fs.readFileSync(tempOutputPath);
        const sticker = new Sticker(webpBuffer, {
          pack: options.pack || 'xyzbot stickers',
          author: options.author || 'xyzuniverse',
          type: StickerTypes.FULL,
          quality: 75,
        });
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(tempOutputPath);
        resolve(sticker);
      })
      .on('error', (err) => {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        reject(err);
      });
  });
}

module.exports = { createStickerFromVideo };
