const { proto, jidDecode, getContentType } = require("@whiskeysockets/baileys");

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/g.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
    } else return jid;
};
exports.decodeJid = decodeJid;

// Fungsi helper untuk mengekstrak pesan ViewOnce
const extractViewOnceMessage = (message) => {
    let viewOnceType = null;
    let viewOnceMessage = null;
    
    // Debug: Tampilkan semua keys yang tersedia
    console.log(`[DEBUG] Available message keys:`, Object.keys(message));
    
    // Cek berbagai tipe ViewOnce
    if (message.viewOnceMessageV2) {
        viewOnceType = 'viewOnceMessageV2';
        viewOnceMessage = message.viewOnceMessageV2.message;
        console.log(`[DEBUG] Found viewOnceMessageV2`);
    } else if (message.viewOnceMessage) {
        viewOnceType = 'viewOnceMessage';
        viewOnceMessage = message.viewOnceMessage.message;
        console.log(`[DEBUG] Found viewOnceMessage`);
    } else {
        // Cek apakah ada key lain yang mungkin berkaitan dengan ViewOnce
        const keys = Object.keys(message);
        const viewOnceKeys = keys.filter(key => key.toLowerCase().includes('viewonce') || key.toLowerCase().includes('once'));
        if (viewOnceKeys.length > 0) {
            console.log(`[DEBUG] Found potential ViewOnce keys:`, viewOnceKeys);
        }
        
        // Cek di dalam imageMessage atau videoMessage apakah ada flag viewOnce
        if (message.imageMessage && message.imageMessage.viewOnce) {
            console.log(`[DEBUG] Found viewOnce flag in imageMessage`);
            viewOnceType = 'imageMessage';
            viewOnceMessage = message;
        } else if (message.videoMessage && message.videoMessage.viewOnce) {
            console.log(`[DEBUG] Found viewOnce flag in videoMessage`);
            viewOnceType = 'videoMessage';
            viewOnceMessage = message;
        }
    }
    
    return { viewOnceType, viewOnceMessage };
};

// Fungsi helper untuk memproses pesan rekursif
const processMessage = (message) => {
    if (!message) return { message: null, isViewOnce: false };
    
    let processedMessage = message;
    let isViewOnce = false;
    
    // Cek ViewOnce PERTAMA sebelum membuka lapisan lain
    const { viewOnceType, viewOnceMessage } = extractViewOnceMessage(processedMessage);
    if (viewOnceType && viewOnceMessage) {
        isViewOnce = true;
        processedMessage = viewOnceMessage;
        console.log(`[DEBUG] ViewOnce detected! Type: ${viewOnceType}`);
    }
    
    // Buka lapisan ephemeral
    if (processedMessage.ephemeralMessage) {
        processedMessage = processedMessage.ephemeralMessage.message;
    }
    
    // Buka lapisan documentWithCaption
    if (processedMessage.documentWithCaptionMessage) {
        processedMessage = processedMessage.documentWithCaptionMessage.message;
    }
    
    // Jika belum detect ViewOnce, cek flag viewOnce di media message
    if (!isViewOnce) {
        const type = getContentType(processedMessage);
        const msg = processedMessage[type];
        
        if (msg && msg.viewOnce) {
            isViewOnce = true;
            console.log(`[DEBUG] ViewOnce flag detected in ${type}!`);
        }
    }
    
    return { message: processedMessage, isViewOnce };
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
        // Debug: Tampilkan struktur pesan mentah
        console.log(`[DEBUG] Raw message keys:`, Object.keys(m.message));
        
        // Proses pesan dengan fungsi helper
        const { message: processedMessage, isViewOnce } = processMessage(m.message);
        
        m.isViewOnce = isViewOnce;
        
        let type = getContentType(processedMessage);
        m.type = type;
        m.msg = processedMessage[type];
        
        // Debug: Tampilkan hasil pemrosesan dan isi pesan
        console.log(`[DEBUG] Processed message - Type: ${type}, IsViewOnce: ${isViewOnce}`);
        if (m.msg && typeof m.msg === 'object') {
            console.log(`[DEBUG] Message content keys:`, Object.keys(m.msg));
            if (m.msg.viewOnce !== undefined) {
                console.log(`[DEBUG] ViewOnce flag value:`, m.msg.viewOnce);
            }
        }
        
        // Ekstrak teks dari berbagai sumber
        m.text = m.msg?.text || m.msg?.caption || m.msg?.conversation || '';

        // --- Logika Cerdas untuk Pesan yang Di-reply ---
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
            
            // Gunakan rekursi untuk memastikan pesan yang dikutip juga diproses dengan benar
            m.quoted = exports.serializeMessage(client, quotedMsgInfo);
            // Bawa serta data mentah untuk fungsi Baileys
            m.quoted.raw = quotedMsgInfo;
            
            // Debug: Tampilkan info pesan quoted
            if (m.quoted.isViewOnce) {
                console.log(`[DEBUG] Quoted message is ViewOnce: ${m.quoted.type}`);
            }
        }
    }
    
    // Fungsi bantuan
    m.reply = (text, options) => client.sendMessage(m.from, { text: typeof text === 'string' ? text : require('util').inspect(text) }, { quoted: m, ...options });
    m.react = async (emoji) => {
        try { await client.sendMessage(m.from, { react: { text: emoji, key: m.key } }); } catch (e) {}
    };

    return m;
};