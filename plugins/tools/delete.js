let handler = async (messages, { client, text, isAdmin, isGroup }) => {
    if (!messages.hasQuotedMsg) {
        messages.react('⚠️');
        return messages.reply('Reply pesan bot untuk menghapus pesan!')
    } else if (messages.hasQuotedMsg) {
        var q = await messages.getQuotedMessage();
        if (q.fromMe || isGroup && isAdmin) q.delete(true); 
        else {
            messages.react("⚠️");
            return messages.reply("Maaf, saya hanya bisa menghapus pesan saya sendiri atau hapus pesan orang lain dalam grup apabila saya admin.")
        }
    }
}

handler.help = ['delete <reply message>', 'del <reply message>']
handler.tags = ['tools']
handler.command = /^del(ete)?$/i

module.exports = handler;