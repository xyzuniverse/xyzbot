const Serializer = require("../lib/Serializer");
const { getGroupMetadata } = require("../lib/CachedGroupMetadata");

// Anti-banjir global
const userSpamData = new Map();
const SPAM_LIMIT = 5;
const SPAM_COOLDOWN = 10 * 1000;

function isUserSpamming(userId) {
    if (userSpamData.has(userId)) {
        const userData = userSpamData.get(userId);
        const { count, lastCommandTime } = userData;
        if (Date.now() - lastCommandTime < SPAM_COOLDOWN) {
            if (count >= SPAM_LIMIT) {
                userData.lastCommandTime = Date.now();
                return true; 
            }
            userData.count++;
        } else {
            userData.count = 1;
            userData.lastCommandTime = Date.now();
        }
    } else {
        userSpamData.set(userId, { count: 1, lastCommandTime: Date.now() });
    }
    return false;
}

module.exports = {
  async chatUpdate(messages) {
    const msg = await Serializer.serializeMessage(this, messages.messages[0]);
    let groupMetadata = null; // Inisialisasi sebagai null

    try {
      if (!msg.message || msg.isBaileys) return;

      const botPrefix = new RegExp("^[" + "/!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]");
      const isCommand = msg.text && botPrefix.test(msg.text);

      if (isCommand) {
          if (isUserSpamming(msg.sender)) {
              if (userSpamData.get(msg.sender).count === SPAM_LIMIT) {
                  return msg.reply("⚠️ Anda mengirim perintah terlalu cepat! Mohon tunggu beberapa saat.");
              }
              return;
          }
      }

      require("./DatabaseHandler")(msg, this);
      require("./AFKHandler")(msg, this);

      let isOwner = [this.user.id.split("@")[0], process.env.owner].map((v) => v?.replace(/[^0-9]/g, "")).includes(msg.sender.split("@")[0]) || msg.key.fromMe;
      if (isOwner) userSpamData.delete(msg.sender);

      // --- Ambil metadata HANYA JIKA DIPERLUKAN ---
      if (isCommand || msg.isGroup) {
          try {
              groupMetadata = msg.isGroup ? await getGroupMetadata(msg.from, this) : null;
          } catch (e) {
              console.error(`Gagal mengambil metadata untuk grup ${msg.from}:`, e);
              // Biarkan groupMetadata tetap null jika gagal
          }
      }
      
      let participants = groupMetadata?.participants || [];
      let user = participants.find((u) => u.id == msg.sender) || {};
      let bot = participants.find((u) => u.id == Serializer.decodeJid(this.user.id)) || {};
      let isAdmin = user.admin === "admin" || user.admin === "superadmin";
      let isBotAdmin = bot.admin === "admin" || bot.admin === "superadmin";

      if (isCommand) {
        const usedPrefix = msg.text.match(botPrefix)[0];
        const args = msg.text.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        if (!this.commands.has(commandName)) return;
        const command = this.commands.get(commandName);

        if (command.admin && !isAdmin) return msg.reply("Perintah ini hanya untuk admin grup.");
        if (command.botAdmin && !isBotAdmin) return msg.reply("Bot harus menjadi admin untuk menjalankan perintah ini.");
        if (command.group && !msg.isGroup) return msg.reply("Perintah ini hanya bisa digunakan di dalam grup.");
        if (command.owner && !isOwner) return msg.reply("Perintah ini khusus untuk Owner Bot.");

        let extra = { bot: this, usedPrefix, participants, groupMetadata, args, command: commandName };
        try {
          await command.execute.call(this, msg, extra);
        } catch (error) {
          console.error(`Error saat menjalankan perintah '${commandName}':`, error);
          msg.reply("Terjadi kesalahan internal saat menjalankan perintah.");
        }
      }

    } finally {
      // Kirim metadata ke fungsi print (bisa null)
      require("../lib/print")(this, msg, groupMetadata);
    }
  },
};