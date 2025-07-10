const { parentPort, workerData } = require("worker_threads");
const { exec } = require("child_process");

/**
 * Worker ini bertugas untuk menjalankan perintah FFmpeg di thread terpisah.
 * Ini mencegah bot utama menjadi lag saat melakukan konversi video.
 */

const { inputFile, outputFile, bitrate } = workerData;

// Perintah FFmpeg untuk mengonversi video ke audio MP3
// -i: file input
// -b:a: bitrate audio
// -vn: hapus stream video
// -f: format output
const command = `ffmpeg -i "${inputFile}" -b:a ${bitrate} -vn -f mp3 "${outputFile}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    // Jika ada error, kirim pesan error ke thread utama
    parentPort.postMessage({ error: error.message });
    return;
  }
  // Jika berhasil, kirim pesan sukses
  parentPort.postMessage({ success: true, path: outputFile });
});