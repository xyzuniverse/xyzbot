const chalk = require("chalk");
const PhoneNumber = require("awesome-phonenumber");
const { decodeJid } = require('./Serializer');

module.exports = async function (bot, msg, groupMetadata) {
  if (!msg || !msg.key) return; // Pemeriksaan keamanan

  let colors = ["red", "green", "blue", "yellow", "magenta", "cyan"];

  var msgType = msg.type ? msg.type.replace(/message$/i, "").replace("audio", msg.msg?.ptt ? "PTT" : "audio").replace(/^./, (v) => v.toUpperCase()) : "UNKNOWN";

  const formatPhoneNumber = (jid) => {
    try {
        if (!jid || !jid.includes('@s.whatsapp.net')) return jid.split('@')[0];
        const pn = PhoneNumber('+' + jid.split('@')[0]);
        return pn.getNumber('international');
    } catch {
        return jid.split('@')[0];
    }
  };

  const botJid = decodeJid(bot.user.id);
  
  const now = new Date();
  // Menyesuaikan waktu ke GMT+7 (Waktu Indonesia Barat)
  const timestamp = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  // Mengambil komponen waktu dari objek yang sudah disesuaikan
  const hours = timestamp.getUTCHours().toString().padStart(2, '0');
  const minutes = timestamp.getUTCMinutes().toString().padStart(2, '0');
  const seconds = timestamp.getUTCSeconds().toString().padStart(2, '0');
  
  // Membuat format waktu dan zona waktu yang diinginkan
  const timeString = `${hours}:${minutes}:${seconds} GMT+7`;

  const groupName = msg.isGroup ? (groupMetadata?.subject || "Grup Tidak Dikenal") : "Chat Pribadi";
  const senderName = msg.pushName || msg.sender.split('@')[0];

  let header_bot = chalk.red("~ " + (bot.user.name || 'Bot') + " " + formatPhoneNumber(botJid)) + " " + chalk.black(chalk.bgYellow(timeString));
  let header_sender = chalk[pickRandom(colors)]("~ " + senderName) + " to " + chalk.green(groupName) + " " + chalk.black(chalk.bgYellow(msgType));
  
  let text = msg.text || "";

  if (msg.msg?.contextInfo?.mentionedJid) {
    for (let user of msg.msg.contextInfo.mentionedJid) {
      const mentionedName = bot.db.data.users[user]?.name || formatPhoneNumber(user);
      text = text.replace("@" + user.split`@`[0], chalk.blueBright("@" + mentionedName));
    }
  }

  return console.log(`${header_bot}\n${header_sender}\n${text}\n`);
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}