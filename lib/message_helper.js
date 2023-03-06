// Load required modules
const {
    getContentType,
    isJidBroadcast,
    isJidGroup,
    extractMessageContent,
    jidDecode,
    proto
} = require("baileys")

exports.connectionHelper = (conn) => {
  if (!conn) return conn;
  conn.sendReact = async(jid, messageKey, emoji) => {
    return conn.sendMessage(jid, { react: { text: emoji, key: messageKey } })
  }
  return conn;
}

/**
 * Simplified the messages object.
 * @param {*} conn
 * @param {*} m
 * @returns
 */
exports.messageHelper = (conn, m) => {
    if (!m) return m
    let proto_m = proto.WebMessageInfo
    if (m.key) {
        m.sender = m.key.fromMe ? this.decodeJid(conn.user.id) : m.key.participant ? this.decodeJid(m.key.participant) : this.decodeJid(m.key.remoteJid)
        m.chat = this.decodeJid(m.key.remoteJid)
        m.isBaileys = m.key.id.startsWith('3EB0') && m.key.id.length === 12 || m.key.id.startsWith('BAE5') && m.key.id.length === 16 || false
        m.fromMe = m.key?.fromMe
        m.isGroup = isJidGroup(m.chat)
    }
    if (m.message) {
        m.messageType = getContentType(m.message) || Object.keys(m.message)[0]
        m.messageContent = extractMessageContent(m.message)[m.messageType] || m.message[m.messageType]
        if (m.messageType === "ephemeralMessage" || m.messageType === 'viewOnceMessageV2' || m.messageType === 'viewOnceMessage') {
            exports.messageHelper(conn, m.messageContent)
            m.messageType = getContentType(m.messageContent) || m.messageContent.messageType
            m.messageContent = extractMessageContent(m.messageContent)[m.messageContent.messageContent] || m.messageContent.messageContent
        }
        if (m.messageContent && typeof m.messageContent === "object") {
            m.mentionedJid = m.messageContent?.contextInfo?.mentionedJid?.length && m.messageContent.contextInfo.mentionedJid || []
            let quoted = m.quoted = m.messageContent.contextInfo ? m.messageContent.contextInfo.quotedMessage : null
            if (m.quoted) {
              let qtype = Object.keys(m.quoted)[0]
              m.quoted = m.quoted[qtype]
              if (typeof m.quoted === "string") m.quoted = { text: m.quoted }
              m.quoted.id = m.messageContent.contextInfo?.stanzaId
              m.quoted.chat = m.chat
              m.quoted.sender = m.messageContent.contextInfo?.participant
              m.quoted.messageType = qtype
              m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || ''
              m.quoted.mentionedJid = m.quoted.contextInfo?.mentionedJid?.length && m.quoted.contextInfo.mentionedJid || []
            }
        }
        m.text = m.messageContent.caption ? m.messageContent.caption : m.messageContent.text ? m.messageContent.text : typeof m.messageContent === "string" ? m.messageContent : ""
    }
    return m
}

/**
 * Decode jid
 * @param {*} jid 
 * @returns 
 */
exports.decodeJid = (jid) => {
    if (!jid) return ""
    var result = jidDecode(jid)
    return result.user + "@" + result.server
}
