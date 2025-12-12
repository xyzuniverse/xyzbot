import type { WASocket } from "baileys";

export default {
    name: "ping",
    description: "Respond with a pong!",
    execute: async (msg: any, { args, bot }: { args: string[], bot: WASocket }) => {
        return msg.reply("Pong!");
    },
};
