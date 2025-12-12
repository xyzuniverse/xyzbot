import type { WASocket } from "baileys";

export default {
    name: "start",
    description: "Returns some greetings from the bot.",
    execute: async (msg: any, { args, bot, usedPrefix }: { args: string[], bot: WASocket, usedPrefix: string }) => {
        msg.react("👋").then(() => {
            msg.reply(
                `Hi there, how can i help? You can use ${usedPrefix}menu for showing command list.`
            );
        });
    },
};
