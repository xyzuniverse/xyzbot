const PhoneNumber = require('awesome-phonenumber');

module.exports = {
  name: "menu",
  alias: ["help"],
  description: "Menampilkan daftar perintah bot.",
  execute: async (msg, { bot, usedPrefix }) => {
    
    // --- Fungsi Aman untuk Membersihkan Nomor ---
    const cleanUserNumber = (jid) => {
        try {
            // Coba format dengan awesome-phonenumber
            const pn = PhoneNumber('+' + jid.split('@')[0]);
            return pn.getNumber('international');
        } catch {
            // Jika gagal, cukup ambil angkanya saja
            return '+' + jid.split('@')[0];
        }
    };
    
    // --- Mengumpulkan Informasi ---
    
    const userName = msg.pushName || "Pengguna";
    const userNumber = cleanUserNumber(msg.sender); // Gunakan fungsi baru
    
    const botName = bot.user.name || "Nama Bot";
    const ownerNumber = `+${process.env.owner.replace(/[^0-9]/g, '')}`;
    
    // --- Membuat Daftar Perintah yang Rapi ---

    // 1. Dapatkan semua perintah unik
    const uniqueCommands = [...new Map(bot.commands.map(cmd => [cmd.name, cmd])).values()];
    
    // 2. Kelompokkan berdasarkan kategori
    const commandsByCategory = {};
    uniqueCommands.forEach(cmd => {
        const category = cmd.category || 'Lainnya';
        if (!commandsByCategory[category]) {
            commandsByCategory[category] = [];
        }
        commandsByCategory[category].push(cmd);
    });

    // 3. Buat teks menu
    let commandText = '';
    for (const category in commandsByCategory) {
        commandText += `┌─○「 *${category.toUpperCase()}* 」\n`;
        commandsByCategory[category].forEach(cmd => {
            commandText += `│ ➤ ${usedPrefix}${cmd.name} - ${cmd.description || 'Tidak ada deskripsi'}\n`;
        });
        commandText += `└─○\n\n`;
    }

    // --- Menyusun Tampilan Menu Final ---

    const menuString = `
┌─○「 *USER INFO* 」
│ *Nama* : ${userName}
│ *Nomor* : ${userNumber}
└─○

┌─○「 *BOT INFO* 」
│ *Nama Bot* : ${botName}
│ *Owner* : ${ownerNumber}
└─○

⊱⋆⊰───⊰⊱ ⋆⋅COMMANDS⋅⋆ ⊰⊱──⊱⋆⊰

${commandText.trim()}
`.trim();

    await bot.sendMessage(msg.from, { text: menuString }, { quoted: msg });
  },
};