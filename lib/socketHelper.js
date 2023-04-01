const { jidDecode } = require('baileys')
exports.socketHelper = (conn) => {
    var parseMention = text => [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')

    /**
     * Reply to a message
     * @param {*} jid 
     * @param {*} text 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    conn.reply = async (jid, text, quoted, options) => {
        return conn.sendMessage(jid, {
            text: text,
            mentions: parseMention(text),
            ...options
        }, {
            quoted
        })
    }

    /**
     * React message with emoticon
     * @param {*} jid 
     * @param {*} emoticon 
     * @param {*} msgkey 
     * @returns 
     */
    conn.sendReact = async (jid, emoticon, msgkey = {}) => {
        let reactMsg = {
            react: {
                text: emoticon,
                key: msgkey
            }
        }
        return await conn.sendMessage(jid, reactMsg)
    }

    /**
     * Decode a jid
     * @param {*} jid 
     * @returns 
     */
    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
           let decode = jidDecode(jid) || {}
           return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    return conn;
}