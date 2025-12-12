import pkg from "baileys";
const { downloadMediaMessage } = pkg as any;
import type { WASocket } from "baileys";
import fs from "fs/promises";
import path from "path";

export default {
    name: "toimage",
    description: "Mengubah stiker WhatsApp menjadi gambar.",
    execute: async (msg: any, { bot }: { bot: WASocket }) => {
        let targetMsg = msg.quoted ? msg.quoted : msg;

        if (!targetMsg.type || !["stickerMessage"].includes(targetMsg.type)) {
            return msg.reply("Balas pesan stiker untuk mengubahnya menjadi gambar.");
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
                return msg.reply("Gagal mengunduh stiker.");
            }

            const filename = `sticker_${Date.now()}.png`;
            const filepath = path.join("/tmp", filename);

            await fs.writeFile(filepath, buffer);

            msg.react("✅");
            await bot.sendMessage(msg.from, {
                image: { url: filepath },
                caption: "gweh thevoid kerasin!",
            });

            await fs.unlink(filepath);
        } catch (error) {
            console.error("Error:", error);
            msg.react("⚠️");
            return msg.reply("Terjadi kesalahan saat memproses stiker.");
        }
    },
};
