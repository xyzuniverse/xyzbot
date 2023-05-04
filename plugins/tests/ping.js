let handler = async(messages, { client, text }) => {
    client.react("🏓")
    client.reply("Pong! Our bot is alive!")
}

handler.command = /^(ping)$/i
module.exports = handler