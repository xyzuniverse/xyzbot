const { parentPort, workerData } = require("worker_threads");
const { spawn } = require("child_process");

async function convertVideo(inputFile, outputFile, bitrate) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", [
      "-i",
      inputFile,
      "-vn",
      "-ab",
      bitrate,
      "-ar",
      "44100",
      "-y",
      outputFile,
    ]);

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr dari worker: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Proses FFmpeg di worker keluar dengan kode ${code}`));
      }
    });
  });
}

convertVideo(workerData.inputFile, workerData.outputFile, workerData.bitrate)
  .then(() => parentPort.postMessage("Konversi selesai"))
  .catch((err) => parentPort.postMessage(err));
