import type { WASocket } from "baileys";

export default (msg: any, bot: WASocket & { db: any }) => {
    let afkUser = bot.db.data.users[msg.sender]
    if (afkUser.afk > -1) {
        msg.reply(`Welcome back, ${afkUser.name || msg.pushName}!\nYou're back into the chat after being AFK for ${clockString(new Date().getTime() - (afkUser.afk as number))} with reason \`${afkUser.afkReason.toLowerCase()}.\``.trim())
        afkUser.afk = -1
        afkUser.afkReason = ''
    }
    let afkJids = [...new Set([...(msg.content?.contextInfo?.mentionedJid || []), ...(msg.quoted ? [msg.quoted.sender] : [])])]
    for (let jid of afkJids) {
        let afkUser = bot.db.data.users[jid as string]
        if (!afkUser) continue
        let afkTime = afkUser.afk
        if (Date.now() - (afkUser.afk as number) < 5000) continue
        let reason = afkUser.afkReason || 'Please chat me later'
        msg.reply(`I'm currently not available since ${clockString(new Date().getTime() - (afkUser.afk as number))} ago.\nReason: \`${reason}\``.trim())
        return true
    }

    function clockString(ms: number) {
        if (isNaN(ms)) return '--';
        let h = Math.floor(ms / 3600000)
        let m = Math.floor(ms / 60000) % 60
        let s = Math.floor(ms / 1000) % 60
        return h > 0 ? `${h} hours` : m > 0 ? `${m} minutes` : `${s} second`
    }
}