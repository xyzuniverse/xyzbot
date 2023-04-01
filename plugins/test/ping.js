let handler = async(m, { conn, text }) => {
    conn.sendMessage(m.chat, { text: 'pong' }, { quoted: m } )
}

handler.command = /^(ping)$/i
module.exports = handler;