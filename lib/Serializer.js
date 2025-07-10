const { proto, jidDecode, getContentType } = require("@whiskeysockets/baileys");

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/g.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
    } else return jid;
};
exports.decodeJid = decodeJid;

const extractViewOnceMessage = (message) => {
    if (!message) return { viewOnceType: null, viewOnceMessage: null };
    
    // Urutan pengecekan yang lebih andal
    if (message.viewOnceMessageV2) {
        return { viewOnceType: 'viewOnceMessageV2', viewOnceMessage: message.viewOnceMessageV2.message };
    }
    if (message.viewOnceMessage) {
        return { viewOnceType: 'viewOnceMessage', viewOnceMessage: message.viewOnceMessage.message };
    }
    // Fallback jika flag ada di dalam media message
    if (message.imageMessage?.viewOnce || message.videoMessage?.viewOnce) {
        return { viewOnceType: getContentType(message), viewOnceMessage: message };
    }
    
    return { viewOnceType: null, viewOnceMessage: null };
};

exports.serializeMessage = (client, m) => {
    if (!m) return m;

    let M = proto.WebMessageInfo;

    // --- Pemrosesan Kunci Pesan ---
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.from = m.key.remoteJid;
        m.isGroup = m.from ? m.from.endsWith('@g.us') : false;
        m.sender = decodeJid(m.key.fromMe && client.user.id || m.participant || m.key.participant || m.from || '');
    }

    // --- Pemrosesan Isi Pesan ---
    if (m.message) {
        let originalMessage = m.message;
        
        // Buka lapisan luar terlebih dahulu
        if (originalMessage.ephemeralMessage) {
            originalMessage = originalMessage.ephemeralMessage.message;
        }
        if (originalMessage.documentWithCaptionMessage) {
            originalMessage = originalMessage.documentWithCaptionMessage.message;
        }
        
        const { viewOnceMessage } = extractViewOnceMessage(originalMessage);
        m.isViewOnce = !!viewOnceMessage;
        
        const finalMessage = viewOnceMessage || originalMessage;
        m.type = getContentType(finalMessage);
        m.msg = finalMessage[m.type] === undefined ? finalMessage : finalMessage[m.type];

        // --- PERBAIKAN UTAMA DI SINI ---
        // Logika baru untuk menangani semua jenis teks
        if (m.type === 'conversation') {
            m.text = m.msg; // Untuk 'conversation', teks ada di m.msg langsung
        } else {
            m.text = m.msg?.text || m.msg?.caption || '';
        }
        
        // Logika untuk pesan yang di-reply
        const quoted = m.msg?.contextInfo?.quotedMessage;
        if (quoted) {
            const participant = decodeJid(m.msg.contextInfo.participant);
            const quotedMsgInfo = M.fromObject({
                key: {
                    remoteJid: m.from,
                    fromMe: participant === decodeJid(client.user.id),
                    id: m.msg.contextInfo.stanzaId,
                    participant,
                },
                message: quoted,
            });
            m.quoted = exports.serializeMessage(client, quotedMsgInfo);
            m.quoted.raw = quotedMsgInfo;
        }
    }
    
    m.reply = (text, options) => client.sendMessage(m.from, { text: typeof text === 'string' ? text : require('util').inspect(text) }, { quoted: m, ...options });
    m.react = async (emoji) => {
        try { await client.sendMessage(m.from, { react: { text: emoji, key: m.key } }); } catch (e) {}
    };

    return m;
};