let handler = async (messages, { client, text }) => {
    if (!messages.hasQuotedMsg) return messages.reply("Reply a view-onced message!")
    let q = await messages.getQuotedMessage();
    if (q.hasMedia && q._data.isViewOnce) {
        messages.react("⏳");
        let media = await q.downloadMedia();
        if (media) {
            messages.react("✅");
            return messages.reply(media, null);
        } else {
            messages.react("⚠️");
            return messages.reply("Getting media failed! Please try again.");
        }
    } else return messages.reply("This is not a view-once message!");
};

handler.help = ['readviewonce <reply msg with viewoncemessage>'];
handler.tags = ['tools'];

handler.command = /^(readviewonce)$/i

module.exports = handler;