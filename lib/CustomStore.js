const fs = require('fs');
const path = require('path');

const storeFilePath = path.join(__dirname, '../client_store.json');

/**
 * Membuat store sederhana untuk menyimpan data chat di memori dan file.
 * Ini adalah pengganti makeInMemoryStore dari Baileys.
 */
const createCustomStore = (options) => {
    let data = {
        messages: {}, // Format: { [jid]: { [msgId]: WAMessage } }
        contacts: {},
        chats: {},
    };

    // Coba baca dari file jika ada
    try {
        if (fs.existsSync(storeFilePath)) {
            const fileContent = fs.readFileSync(storeFilePath, { encoding: 'utf-8' });
            const parsedData = JSON.parse(fileContent);
            if (typeof parsedData === 'object' && parsedData !== null) {
                data = { ...data, ...parsedData };
            }
        }
    } catch (e) {
        options.logger?.error({ e }, 'Gagal membaca file store');
    }

    // Fungsi untuk menulis data ke file
    const writeToFile = () => {
        try {
            fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2));
        } catch (e) {
            options.logger?.error({ e }, 'Gagal menulis ke file store');
        }
    };
    
    // Simpan ke file setiap 1 menit
    setInterval(writeToFile, 60_000);

    // Fungsi untuk mengikat event dari Baileys
    const bind = (ev) => {
        ev.on('messages.upsert', ({ messages }) => {
            for (const msg of messages) {
                const jid = msg.key.remoteJid;
                if (!jid) continue;

                if (!data.messages[jid]) {
                    data.messages[jid] = {};
                }
                // Simpan pesan ke dalam store
                data.messages[jid][msg.key.id] = msg;
            }
        });
    };

    // Fungsi untuk memuat pesan dari store
    const loadMessage = async (jid, id) => {
        return data.messages[jid]?.[id];
    };

    return {
        data,
        bind,
        loadMessage,
        writeToFile,
    };
};

module.exports = { createCustomStore };