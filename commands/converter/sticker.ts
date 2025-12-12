import { Sticker, StickerTypes } from "wa-sticker-formatter";
import pkg from "baileys";
const { downloadMediaMessage } = pkg as any;
import type { WASocket } from "baileys";

export default {
    name: "sticker",
    alias: ["s"],
    description: "Convert image/video message into sticker.",
    execute: async (msg: any, { args, bot }: { args: string[], bot: WASocket }) => {
        let q = msg.quoted ? msg.quoted : msg;
        let isMedia = ["image", "video"].includes(q.type.replace(/message$/i, ""));
        if (isMedia) {
            msg.react("⏳");
            let buffer = await downloadMediaMessage(
                q,
                "buffer",
                {},
                { reuploadRequest: bot.updateMediaMessage } as any
            );
            let sticker = new Sticker(buffer, {
                pack: process.env.stickerPackname
                    ? process.env.stickerPackname
                    : "xyzbot's stickers.",
                author: process.env.stickerAuthor
                    ? process.env.stickerAuthor
                    : "xyzuniverse - rexprjkt on github.",
                type: StickerTypes.FULL,
                quality: 50,
            });
            if (sticker) {
                msg.react("✅");
                return msg.reply(await sticker.toMessage());
            } else {
                msg.react("⚠️");
                return msg.reply(
                    "Conversion failed, please contact owner to resolve this issue."
                );
            }
        } else
            return msg.reply(
                "Reply/include a media message then execute this command."
            );
    },
};
