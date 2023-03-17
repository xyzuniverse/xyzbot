exports.messageHelper = (conn, m) => {
    if (!m) return m
    let id = m.key?.id
    let sender = m.key.fromMe ? conn.user.id : m.key.participant ? m.key.participant : m.key.remoteJid
    let chat = m.key?.remoteJid
    let name = m.pushName
    let fromMe = m.key?.fromMe
    let message = m.message
    let type = Object.keys(m.message)[0]
    let messageContent = m.message[type]
    if (type === 'ephemeralMessage') {
        type = Object.keys(m.message[type].message)[0]
        messageContent = m.message.ephemeralMessage.message[type]
    }
    let text = messageContent.caption ? messageContent.caption : messageContent.text ? messageContent.text : typeof messageContent === "string" ? messageContent : ""
    let mentionedJid = []
    let quoted = null
    if (messageContent && typeof messageContent === 'object') {
       if (messageContent?.contextInfo?.mentionedJid?.length && messageContent.contextInfo.mentionedJid) mentionedJid = messageContent.contextInfo.mentionedJid
       if (messageContent?.contextInfo?.quotedMessage) {
           let qtype = Object.keys(messageContent.contextInfo.quotedMessage)[0]
           quoted = messageContent.contextInfo.quotedMessage[qtype]
           if (typeof quoted === 'string') quoted = { text: quoted }
           q_id = messageContent.contextInfo?.stanzaId
           q_chat = chat
           q_sender = messageContent.contextInfo?.participant
           q_text = quoted.text || quoted.caption || quoted.contentText || ''
           q_mentionedJid = quoted.contextInfo?.mentionedJid?.length && quoted.contextInfo.mentionedJid || []
           quoted = {
            id: q_id,
            chat: q_chat,
            sender: q_sender,
            text: q_text,
            mentionedJid: q_mentionedJid
           }
        }
    }
    return {
        id,
        sender,
        chat,
        name,
        message,
        messageContent,
        type,
        mentionedJid,
        quoted: quoted,
        text
    }
}