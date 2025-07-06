module.exports = (msg, bot) => {
    let afkUser = bot.db.data.users[msg.sender]
    if (afkUser.afk > -1) {
      msg.reply(`Welcome back, ${afkUser.name || msg.pushName}!\nYou're back into the chat after being AFK for ${clockString(new Date - afkUser.afk)} with reason \`${afkUser.afkReason.toLowerCase()}.\``.trim())
      afkUser.afk = -1
      afkUser.afkReason = ''
    }
    let afkJids = [...new Set([...(msg.mentionedJid || []), ...(msg.quoted ? [msg.quoted.sender] : [])])]
    for (let jid of afkJids) {
      let afkUser = bot.db.data.users[jid]
      if (!afkUser) continue
      let afkTime = afkUser.afk
      if (!afkTime || afkTime < 0) continue
      let reason = afkUser.afkReason || 'Please chat me later'
      msg.reply(`I'm currently not available since ${clockString(new Date - afkUser.afk)} ago.\nReason: \`${reason}\``.trim())
    }
    return true
}

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return h > 1 ? `${h} hours` : m > 1 ? `${m} minutes` : `${s} second`
}