let handler = async(messages, { client, text }) => {
    if (!text) return messages.reply("Isi cookie tokennya!")
    if (!text.includes("cookie_token") || !text.includes("ltoken") || !text.includes("ltuid") || !text.includes("account_id")) return messages.reply("Cookie token invalid!")
    let user = global.db.data.users[messages.author || messages.from]
    user.hoyolab = {
        cookieToken: text
    }
    await global.db.write()
    messages.reply("Cookie token telah disimpan di database, pastikan digunakan dengan bijak!")
}

handler.help = ['hoyolabgetcookie (cookie token)']
handler.tags = ['hoyolab']
handler.private = true
handler.command = /^(hoyolabgetcookie)$/i
module.exports = handler;