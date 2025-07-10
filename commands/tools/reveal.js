const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "reveal",
  alias: ["rvo"],
  description: "Membaca pesan sekali lihat (gambar/video).",
  execute: async (msg, { bot, args }) => {
    
    // Debug: Tampilkan info pesan quoted
    if (msg.quoted) {
        console.log(`[DEBUG] Quoted message info:`, {
            type: msg.quoted.type,
            isViewOnce: msg.quoted.isViewOnce,
            hasRaw: !!msg.quoted.raw
        });
        
        // Debug: Tampilkan struktur pesan mentah quoted
        if (msg.quoted.raw?.message) {
            console.log(`[DEBUG] Quoted raw message keys:`, Object.keys(msg.quoted.raw.message));
            
            // Cek setiap jenis pesan media untuk flag viewOnce
            const messageTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
            messageTypes.forEach(type => {
                if (msg.quoted.raw.message[type]) {
                    console.log(`[DEBUG] ${type} properties:`, Object.keys(msg.quoted.raw.message[type]));
                    if (msg.quoted.raw.message[type].viewOnce !== undefined) {
                        console.log(`[DEBUG] ${type} viewOnce flag:`, msg.quoted.raw.message[type].viewOnce);
                    }
                }
            });
        }
    }
    
    // Pengecekan yang lebih detail
    if (!msg.quoted) {
        return msg.reply("⚠️ Anda harus me-reply sebuah pesan.");
    }
    
    if (!msg.quoted.isViewOnce) {
        // Fallback: Cek langsung di raw message
        let isViewOnceFromRaw = false;
        if (msg.quoted.raw?.message) {
            const rawMessage = msg.quoted.raw.message;
            // Cek apakah ada flag viewOnce di media message
            if (rawMessage.imageMessage?.viewOnce || rawMessage.videoMessage?.viewOnce || rawMessage.audioMessage?.viewOnce) {
                isViewOnceFromRaw = true;
                console.log(`[DEBUG] ViewOnce detected from raw message!`);
            }
        }
        
        if (!isViewOnceFromRaw) {
            return msg.reply(`⚠️ Pesan yang di-reply bukan pesan sekali lihat (view once).\nTipe pesan: ${msg.quoted.type || 'tidak diketahui'}`);
        }
    }
    
    if (!msg.quoted.raw) {
        return msg.reply("⚠️ Data mentah pesan tidak tersedia.");
    }
    
    await msg.react("⏳");
    try {
        // Debug: Tampilkan struktur pesan mentah
        console.log(`[DEBUG] Raw message structure:`, JSON.stringify(msg.quoted.raw.message, null, 2));
        
        // Gunakan objek 'raw' yang disediakan oleh Serializer baru
        const buffer = await downloadMediaMessage(
            msg.quoted.raw, 
            "buffer",
            {},
            { reuploadRequest: bot.updateMediaMessage }
        );

        if (buffer) {
            await msg.react("✅");
            const mediaType = msg.quoted.type.replace('Message', '');
            const caption = msg.quoted.text || '';
            const targetJid = args[0] === "private" ? msg.sender : msg.from;
            
            await bot.sendMessage(
                targetJid,
                { [mediaType]: buffer, caption: caption },
                { quoted: msg }
            );
        } else {
            await msg.reply("Gagal mengunduh media.");
        }
    } catch (e) {
        await msg.react("⚠️");
        console.error(`[ERROR] Reveal command failed:`, e);
        await msg.reply(`Terjadi kesalahan: ${e.message}`);
    }
  },
};