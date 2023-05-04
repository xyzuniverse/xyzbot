let handler = async(client, { messages, text }) => {
    client.react("🏓")
    client.reply("Pong! Our bot is alive!")
}

handler.command = /^(ping)$/i
module.exports = handler