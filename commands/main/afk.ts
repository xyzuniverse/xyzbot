import type { WASocket } from "baileys";

export default {
    name: "afk",
    description: "Leave your message into bot while u're afk.",
    group: true,
    execute: async (msg: any, { bot, args }: { bot: WASocket & { db: any }, args: string[] }) => {
        let text = args.join(" ")
        let _afkUser = bot.db.data.users[msg.sender];
        _afkUser.afk = + new Date
        _afkUser.afkReason = text ? text : "Please chat me later"
        msg.reply(`*_Into the void!_*\n${msg.pushName} is now AFK.\nReason: \`${_afkUser.afkReason}\``)
    }
}
