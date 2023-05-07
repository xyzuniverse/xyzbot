let handler = async(msg, { client, text }) => {
    msg.react("🏓")
    msg.reply("Pong! Our bot is alive!")
}

handler.command = /^(ping)$/i
module.exports = handler
