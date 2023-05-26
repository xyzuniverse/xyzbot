let handler = async (msg, { text, usedPrefix, command }) => {
    if (!text) return msg.reply(`where's the path?\n\nexample:\n${usedPrefix + command} plugins/main/menu.js`)
    if (!msg.hasQuoteMessage) throw `Reply a code!`
    let path = `${text}`
    await require('fs').writeFileSync(path, await (await msg.getQuotedMessage()).body)
    msg.reply(`Saved ${path} to file!`)
}

handler.help = ['savefile', 'sf'].map(v => v + ' <path>')
handler.tags = ['owner']
handler.command = ['savefile', 'sf']

handler.owner = true
module.exports = handler