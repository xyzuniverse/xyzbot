import { Worker } from "worker_threads";
import pkg from "baileys";
const { downloadMediaMessage } = pkg as any;
import type { WASocket } from "baileys";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fungsi untuk menjalankan konversi di worker thread
function convertVideoInWorker(inputFile: string, outputFile: string, bitrate: string) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, "worker.js"), {
            workerData: { inputFile, outputFile, bitrate },
        });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker berhenti dengan kode ${code}`));
            }
        });
    });
}

export default {
    name: "audio",
    description: "Konversi video ke format audio (MP3) dengan custom bitrate.",
    execute: async (msg: any, { bot }: { bot: WASocket }) => {
        let targetMsg = msg.quoted ? msg.quoted : msg;
        let bitrate = "128k"; // Default bitrate

        if (msg.text) {
            const args = msg.text.split(" ");
            const bitrateArg = args.find(
                (arg: string) =>
                    arg.toLowerCase().endsWith("k") ||
                    arg.toLowerCase().endsWith("m") ||
                    arg.toLowerCase().endsWith("kbps") ||
                    arg.toLowerCase().endsWith("kbit/s") ||
                    arg.toLowerCase().endsWith("mbps") ||
                    arg.toLowerCase().endsWith("mbit/s")
            );
            if (bitrateArg) {
                bitrate = bitrateArg;
                if (
                    !/^\d+[km]$/i.test(bitrate) &&
                    !/^\d+(kbit\/s|kbps|mbit\/s|mbps)$/i.test(bitrate)
                ) {
                    // Validasi format bitrate
                    return msg.reply(
                        "Format bitrate tidak valid. Contoh: 128k, 192k, 1m, 128kbps, 1 Mbit/s."
                    );
                }
            }
        }

        if (!targetMsg.type || !["videoMessage"].includes(targetMsg.type)) {
            return msg.reply(
                `Balas pesan video untuk mengkonversinya ke audio. Anda bisa menambahkan bitrate custom, contoh: /convert2audio 192k`
            );
        }

        try {
            msg.react("⏳");

            const buffer = await downloadMediaMessage(
                targetMsg,
                "buffer",
                {},
                { reuploadRequest: bot.updateMediaMessage } as any
            );

            if (!buffer) {
                msg.react("⚠️");
                return msg.reply("Gagal mengunduh media.");
            }

            const inputFile = `/tmp/input_${Date.now()}.mp4`;
            const outputFile = `/tmp/output_${Date.now()}.mp3`;

            await fs.writeFile(inputFile, buffer);

            await convertVideoInWorker(inputFile, outputFile, bitrate); // call fungsi worker

            const outputBuffer = await fs.readFile(outputFile);
            await fs.unlink(inputFile);
            await fs.unlink(outputFile);
            msg.react("✅");
            return bot.sendMessage(msg.from, {
                audio: outputBuffer,
                mimetype: "audio/mpeg",
            });
        } catch (error) {
            console.error("Error:", error);
            msg.react("⚠️");
            return msg.reply("Terjadi kesalahan. Coba lagi nanti.");
        }
    },
};
