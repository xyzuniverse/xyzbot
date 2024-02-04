let handler = async(msg, { client, text }) => {
    let userJid = msg.author || msg.from
    let _afkUser = global.db.data.users[msg.author || msg.from];
    _afkUser.afk = + new Date
    _afkUser.afkReason = text ? text : "Please chat me later."
    msg.reply(`*_Into the void!_*\n@${userJid.split`@`[0]} is now AFK.\nReason : ${_afkUser.afkReason}`)
}

handler.tags = ['group'];
handler.command = /^(afk)$/i

module.exports = handler;