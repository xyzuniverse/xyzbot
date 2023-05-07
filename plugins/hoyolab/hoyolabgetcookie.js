let handler = async(msg, { client, text }) => {
    if (!text) return msg.reply("Isi cookie tokennya!")
    if (!text.includes("cookie_token") || !text.includes("ltoken") || !text.includes("ltuid") || !text.includes("account_id")) return msg.reply("Cookie token invalid!")
    let user = global.db.data.users[msg.author || msg.from]
    user.hoyolab = {
        cookieToken: text
    }
    await global.db.write()
    msg.reply("Cookie token telah disimpan di database, pastikan digunakan dengan bijak!")
}

handler.help = ['hoyolabgetcookie (cookie token)']
handler.tags = ['hoyolab']
handler.private = true
handler.command = /^(hoyolabgetcookie)$/i
module.exports = handler;