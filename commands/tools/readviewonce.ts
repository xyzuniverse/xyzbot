import pkg from "baileys";
const { downloadMediaMessage } = pkg as any;
import type { WASocket } from "baileys";

export default {
    name: "readviewonce",
    alias: ["rvo"],
    description: "Read view once message.",
    execute: async (msg: any, { bot }: { bot: WASocket }) => {
        if (msg.quoted?.type !== "viewOnceMessageV2")
            return msg.reply("Quote a view once message.");
        let buffer = await downloadMediaMessage(
            msg.quoted,
            "buffer",
            {},
            { reuploadRequest: bot.updateMediaMessage } as any
        );
        if (buffer) {
            msg.react("✅");
            if (msg.quoted.type.replace(/message$/i, "") == "audio") {
                msg.reply({
                    audio: Buffer.from(buffer),
                    mimetype: "audio/mpeg",
                    ptt: true,
                });
            } else {
                msg.reply({
                    [msg.quoted.type.replace(/message$/i, "")]: Buffer.from(buffer),
                    caption: msg.quoted.text ? msg.quoted.text : "",
                } as any);
            }
        } else return msg.reply("Getting media failed.");
    },
};
