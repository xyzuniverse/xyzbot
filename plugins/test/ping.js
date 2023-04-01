let handler = async(m, { conn, text }) => {
    conn.sendReact(m.chat, "🏓", m.key)
}

handler.command = /^(ping)$/i
module.exports = handler;