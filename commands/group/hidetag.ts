import type { WASocket } from "baileys";

export default {
    name: "hidetag",
    description: "Silently tag all group members with your message.",
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (msg: any, { bot, args, participants }: { bot: WASocket, args: string[], participants: any[] }) => {
        const members = participants
            .filter((participant) => participant.admin !== "superadmin" && participant.admin !== "admin")
            .map((participant) => participant.id);
        return bot.sendMessage(msg.from, { text: args.join(" "), mentions: members });
    },
};
