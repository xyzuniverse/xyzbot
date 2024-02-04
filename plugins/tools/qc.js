const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

let handler = async (msg, { client, text }) => {
    var user = msg.hasQuotedMsg ? await (await msg.getQuotedMessage()).getContact() : await msg.getContact();
    var mentions = [];
    var _mentions = msg.hasQuotedMsg ? await (await msg.getQuotedMessage()).mentionedIds : msg.mentionedIds
    text = msg.hasQuotedMsg ? await (await msg.getQuotedMessage()).body : text;
 
    if (!text) {
        msg.react("⚠️");
        return msg.reply("Ketikkan sebuah teks atau reply sebuah pesan!");
    }
    
    if (mentions) {
        if (msg.hasQuotedMsg) {
            _mentions.forEach(user => {
                mentions.push(user._serialized);
            })
        }
        for (let users of mentions) text = text.replace('@' + users.split`@`[0], "@" + await (await client.getContactById(users)).pushname || client.info.pushname)
    }

    // Try to get Profile picture
    var pp
    try {
        pp = await client.getProfilePicUrl(user.id._serialized || client.info.wid._serialized);
    } catch {
        pp = "https://telegra.ph/file/2b1ed079ea221a4ea3237.png"
    };

    // Generate a quoted chat
    const request = {
        "type": "quote",
        "format": "png",
        "backgroundColor": "#202c33",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [
            {
            "entities": [],
            "avatar": true,
            "from": {
                "id": 1,
                "name": user.pushname || client.info.pushname,
                "photo": {
                "url": pp
                }
            },
            "text": text,
            "replyMessage": {}
            }
        ]
    };
    msg.react("⏳");
    const { data } = await axios.post("https://api.safone.dev/quotly", request, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (data) {
        var media = new MessageMedia('image/png', data.image, null);
        msg.react("✅");
        return msg.reply(media, null, { sendMediaAsSticker: true, stickerName: global.sticker.packname, stickerAuthor: global.sticker.author });
    } else {
        msg.react("⚠️");
        return msg.reply("Terjadi kesalahan, silahkan coba lagi.");
    };
}

handler.help = ['qc <teks atau reply sebuah message>']
handler.tags = ['tools']
handler.command = /^(qc)$/i
module.exports = handler;