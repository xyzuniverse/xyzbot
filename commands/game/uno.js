const { Game, Value, Color } = require('uno-engine');
const fs = require('fs');
const path = require('path');

const unoGames = {};

const Terjemahan = {
    warna: { 'merah': 'RED', 'red': 'RED', 'kuning': 'YELLOW', 'yellow': 'YELLOW', 'hijau': 'GREEN', 'green': 'GREEN', 'biru': 'BLUE', 'blue': 'BLUE' },
    nilai: {
        '0': 'ZERO', 'nol': 'ZERO', 'zero': 'ZERO', 
        '1': 'ONE', 'satu': 'ONE', 'one': 'ONE', 
        '2': 'TWO', 'dua': 'TWO', 'two': 'TWO', 
        '3': 'THREE', 'tiga': 'THREE', 'three': 'THREE', 
        '4': 'FOUR', 'empat': 'FOUR', 'four': 'FOUR', 
        '5': 'FIVE', 'lima': 'FIVE', 'five': 'FIVE', 
        '6': 'SIX', 'enam': 'SIX', 'six': 'SIX', 
        '7': 'SEVEN', 'tujuh': 'SEVEN', 'seven': 'SEVEN', 
        '8': 'EIGHT', 'delapan': 'EIGHT', 'eight': 'EIGHT', 
        '9': 'NINE', 'sembilan': 'NINE', 'nine': 'NINE',
        'skip': 'SKIP', 'lewati': 'SKIP', 
        'reverse': 'REVERSE', 'putar-balik': 'REVERSE', 
        'draw-two': 'DRAW_TWO', 'tambah-2': 'DRAW_TWO', 'tambah_2': 'DRAW_TWO',
        'wild': 'WILD', 'hitam': 'WILD', 
        'wild-draw-four': 'WILD_DRAW_FOUR', 'tambah-4': 'WILD_DRAW_FOUR', 'tambah_4': 'WILD_DRAW_FOUR'
    }
};

function valueToString(value) {
    const key = Object.keys(Value).find(k => Value[k] === value);
    return key ? key.toLowerCase().replace(/_/g, '-') : 'unknown';
}
function colorToString(color) {
    if (!color) return null;
    const key = Object.keys(Color).find(k => Color[k] === color);
    return key ? key.toLowerCase() : null;
}
function cardToFileName(card) {
    const valueStr = valueToString(card.value);
    const colorStr = colorToString(card.color);
    if (valueStr === 'wild' || valueStr === 'wild-draw-four') {
        return `${valueStr}.png`;
    }
    return `${colorStr}_${valueStr}.png`;
}
async function sendPlayerHand(bot, player, hand, groupId) {
    try {
        await bot.sendMessage(player.id, { text: "====================\n\n🃏 *Kartu Anda saat ini:* \n\n====================" });
        for (const card of hand) {
            const fileName = cardToFileName(card);
            const filePath = path.join(__dirname, '../../lib/cards/', fileName);
            const color = colorToString(card.color) || 'hitam';
            let value = valueToString(card.value).replace('-','_');
            if (value === 'wild_draw_four') value = 'tambah_4';
            if (value === 'draw_two') value = 'tambah_2';
            if (value === 'reverse') value = 'putar-balik';
            if (value === 'skip') value = 'lewati';
            const playCommand = `.uno ${color} ${value}`;
            if (fs.existsSync(filePath)) {
                const caption = value.startsWith('wild') || value.startsWith('tambah_4')
                    ? `Ketik: \`.uno ${value} <warna>\`\n(Contoh: .uno ${value} merah)`
                    : `Ketik: \`${playCommand}\``;
                await bot.sendMessage(player.id, { image: fs.readFileSync(filePath), caption });
            } else {
                await bot.sendMessage(player.id, { text: `Kartu: ${(color || '').toUpperCase()} ${value.toUpperCase()}`});
                console.warn(`File kartu tidak ditemukan: ${fileName}`);
            }
        }
    } catch (e) {
        console.error(`Gagal mengirim kartu ke ${player.name}:`, e);
    }
}
async function announceGameState(bot, msg, session) {
    const game = session.game;
    const topCard = game.discardedCard;
    const currentPlayerId = game.currentPlayer.name;
    const currentPlayer = session.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return msg.reply("Error Kritis: Pemain tidak ditemukan.");
    const topCardPath = path.join(__dirname, '../../lib/cards/', cardToFileName(topCard));
    if (!fs.existsSync(topCardPath)) return msg.reply("Error: Gagal menemukan gambar kartu teratas.");
    const playerMension = `@${currentPlayer.name} (${currentPlayer.id.split('@')[0]})`;
    let message = `*Giliran: ${playerMension}*\nJumlah kartu: ${game.getPlayer(currentPlayer.id).hand.length}`;
    await bot.sendMessage(msg.from, {
        image: fs.readFileSync(topCardPath),
        caption: `🃏 Kartu teratas: *${(colorToString(topCard.color) || 'WILD').toUpperCase()} ${valueToString(topCard.value).toUpperCase().replace(/-/g, ' ')}*\n\n${message}`,
        mentions: [currentPlayer.id]
    });
}
async function notifyPlayersOfEnd(bot, players, winner, endMessage) {
    for (const player of players) {
        try {
            const message = (winner && player.id === winner.id) ? "Selamat, Anda memenangkan permainan! 🥳" : endMessage;
            await bot.sendMessage(player.id, { text: message });
        } catch (e) {}
    }
}

module.exports = {
  name: "uno",
  alias: ["unocreate", "unojoin", "unostart", "unoend", "unocards", "unodraw"],
  description: "Memainkan game UNO.",
  execute: async (msg, { bot, args, command, usedPrefix }) => {
    const groupId = msg.from;
    const senderId = msg.sender;
    const senderName = msg.pushName;
    
    // --- PERBAIKAN UTAMA: FUNGSI BANTUAN UNTUK .uno ---
    if (command === "uno" && args.length === 0) {
        const helpMessage = `
🃏 *Game UNO Bot* 🃏

Berikut adalah perintah yang tersedia untuk mengelola permainan UNO:

*Lobi Permainan:*
- \`${usedPrefix}unocreate\`: Membuat lobi game baru.
- \`${usedPrefix}unojoin\`: Bergabung ke lobi yang sudah ada.
- \`${usedPrefix}unostart\`: Memulai permainan (hanya host).
- \`${usedPrefix}unoend\`: Menghentikan permainan (hanya host).

*Saat Bermain:*
- \`${usedPrefix}uno <warna> <nilai>\`: Memainkan kartu. Contoh: \`.uno merah 7\` atau \`.uno hijau lewati\`.
- \`${usedPrefix}uno <wild> <warna>\`: Memainkan kartu wild. Contoh: \`.uno wild merah\` atau \`.uno tambah_4 biru\`.
- \`${usedPrefix}unocards\`: Meminta bot mengirim ulang kartu Anda di PM.
- \`${usedPrefix}unodraw\`: Mengambil kartu dari tumpukan.

Selamat bermain!
        `;
        return msg.reply(helpMessage.trim());
    }

    if (command === "unocreate") {
        if (unoGames[groupId]) return msg.reply("⚠️ Sudah ada sesi game UNO yang aktif.");
        unoGames[groupId] = { host: senderId, players: [{ id: senderId, name: senderName }], status: 'waiting' };
        return msg.reply(`✅ Lobi UNO dibuat oleh @${senderName} (${senderId.split('@')[0]})!\nKetik \`${usedPrefix}unojoin\` untuk bergabung.`, { mentions: [senderId] });
    }
    if (command === "unojoin") {
        const session = unoGames[groupId];
        if (!session || session.status !== 'waiting') return msg.reply("⚠️ Tidak ada lobi untuk bergabung.");
        if (session.players.some(p => p.id === senderId)) return msg.reply("⚠️ Anda sudah bergabung.");
        session.players.push({ id: senderId, name: senderName });
        let playerList = "👥 *Pemain saat ini:*\n";
        session.players.forEach((p, i) => { playerList += `${i + 1}. ${p.name} (@${p.id.split('@')[0]})\n`; });
        await msg.reply(`✅ @${senderName} (${senderId.split('@')[0]}) berhasil bergabung!\n\n${playerList}`, { mentions: [senderId, ...session.players.map(p => p.id)] });
        return;
    }
    if (command === "unoend") {
        const session = unoGames[groupId];
        if (!session) return msg.reply("⚠️ Tidak ada game yang berjalan.");
        if (session.host !== senderId) return msg.reply("⚠️ Hanya host yang bisa menghentikan game.");
        const endMessage = `ℹ️ Game UNO di grup ini telah dihentikan oleh host (@${senderName} (${senderId.split('@')[0]})).`;
        await notifyPlayersOfEnd(bot, session.players, null, endMessage);
        delete unoGames[groupId];
        return msg.reply(endMessage, { mentions: [senderId] });
    }
    if (command === "unostart") {
        const session = unoGames[groupId];
        if (session?.host !== senderId) return msg.reply("⚠️ Hanya host yang bisa memulai game.");
        if (session.players.length < 2) return msg.reply("⚠️ Butuh minimal 2 pemain.");
        session.status = 'playing';
        session.game = new Game(session.players.map(p => p.id));
        await msg.reply("✅ Game dimulai! Mengirim kartu...");
        for (const p of session.players) {
            await sendPlayerHand(bot, p, session.game.getPlayer(p.id).hand, groupId);
        }
        await announceGameState(bot, msg, session);
        return;
    }

    const session = unoGames[groupId];
    if (!session || session.status !== 'playing') return;
    const game = session.game;
    const player = game.getPlayer(senderId);

    if (command === "unocards") {
        if (!player) return msg.reply("⚠️ Anda bukan bagian dari game ini.");
        return await sendPlayerHand(bot, { id: senderId, name: senderName }, player.hand, groupId);
    }
    
    if (command === "unodraw") {
        if (game.currentPlayer.name !== senderId) return msg.reply("⚠️ Belum giliran Anda!");
        try {
            game.draw();
            await msg.reply(`@${senderName} (${senderId.split('@')[0]}) mengambil kartu.`, { mentions: [senderId] });
            game.pass();
            await sendPlayerHand(bot, { id: senderId, name: senderName }, player.hand, groupId);
            await announceGameState(bot, msg, session); 
        } catch (e) {
            return msg.reply(`⚠️ Gagal mengambil kartu: ${e.message}`);
        }
        return;
    }
    
    if (command === "uno") {
        if (game.currentPlayer.name !== senderId) return msg.reply("⚠️ Belum giliran Anda!");
        if (args.length < 1) return; // Seharusnya sudah ditangani oleh blok bantuan di atas

        const input1 = args[0]?.toLowerCase();
        const input2 = args[1]?.toLowerCase();
        
        let cardToPlay;
        try {
            const translatedKey1 = Terjemahan.nilai[input1] || Terjemahan.warna[input1];
            if (translatedKey1 === 'WILD' || translatedKey1 === 'WILD_DRAW_FOUR') {
                const valueToFind = Value[translatedKey1];
                cardToPlay = player.getCardByValue(valueToFind);
                if (!cardToPlay) return msg.reply("⚠️ Anda tidak memiliki kartu wild tersebut!");
                const translatedChosenColorKey = Terjemahan.warna[input2];
                if (!translatedChosenColorKey) return msg.reply(`⚠️ Anda harus memilih warna setelah kartu wild! Contoh: \`.uno ${input1} merah\``);
                cardToPlay.color = Color[translatedChosenColorKey];
            } else {
                const translatedColorKey = Terjemahan.warna[input1];
                const translatedValueKey = Terjemahan.nilai[input2];
                if (!translatedColorKey || !translatedValueKey) return msg.reply("⚠️ Input kartu tidak valid. (Contoh: .uno merah 7, .uno biru lewati)");
                const targetColor = Color[translatedColorKey];
                const targetValue = Value[translatedValueKey];
                cardToPlay = player.hand.find(c => c.color === targetColor && c.value === targetValue);
            }

            if (!cardToPlay) return msg.reply("⚠️ Anda tidak memiliki kartu tersebut!");

            game.play(cardToPlay);
            
            if (player.hand.length === 0) {
                const winner = session.players.find(p => p.id === senderId);
                let scoreboard = "🏆 *Papan Skor Akhir* 🏆";
                session.players.forEach(p => {
                    if (p.id !== winner.id) {
                        const remainingCards = game.getPlayer(p.id).hand.length;
                        scoreboard += `\n- ${p.name} (@${p.id.split('@')[0]}): ${remainingCards} kartu`;
                    }
                });
                const endMessageToGroup = `🎉 *PEMENANG!* 🎉\n\nSelamat kepada @${winner.name} (${winner.id.split('@')[0]}), dia telah menghabiskan semua kartunya!\n\n${scoreboard}`;
                const endMessageToLosers = `Game UNO telah berakhir. Pemenangnya adalah ${winner.name}!`;
                await notifyPlayersOfEnd(bot, session.players, winner, endMessageToLosers);
                delete unoGames[groupId];
                return msg.reply(endMessageToGroup, { mentions: session.players.map(p => p.id) });
            }
            
            await msg.reply(`@${senderName} (${senderId.split('@')[0]}) memainkan kartu.`, { mentions: [senderId] });
            await announceGameState(bot, msg, session);
            await sendPlayerHand(bot, { id: senderId, name: senderName }, player.hand, groupId);
        } catch (e) {
            return msg.reply(`❌ Gagal memainkan kartu: ${e.message}`);
        }
    }
  },
};
