let handler = async(messages, { client, text }) => {
    messages.react("🏓")
    messages.reply("Pong! Our bot is alive!")
}

handler.command = /^(ping)$/i
module.exports = handler
