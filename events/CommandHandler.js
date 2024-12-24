const Serializer = require("../lib/Serializer");
module.exports = {
  async chatUpdate(messages) {
    const msg = Serializer.serializeMessage(this, messages.messages[0]);
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    // console.log(JSON.stringify(msg, null, 2));

    // Command handling
    const botPrefix = new RegExp(
      "^[" +
        "/!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(
          /[|\\{}()[\]^$+*?.\-\^]/g,
          "\\$&"
        ) +
        "]"
    );
    let usedPrefix = msg.text.match(botPrefix)?.[0];
    if (!usedPrefix) return; // If no prefix is found, exit

    const args = msg.text.slice(usedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    if (!this.commands.has(commandName))
      return msg.reply(
        `Unknown command: ${commandName}\n... maybe try see ${usedPrefix}menu for check some commands list?`
      );
    const command = this.commands.get(commandName);

    // Midman - prevent user to run command if the user doesn't have the permission
    let isROwner = [this.user.id.split("@")[0], process.env.owner]
      .map((v) => v?.replace(/[^0-9]/g, ""))
      .includes(msg.sender.split("@")[0]);
    let isOwner = isROwner || msg.key.fromMe;
    let groupMetadata = msg.isGroup ? await this.groupMetadata(msg.from) : {};
    let participants = msg.isGroup ? groupMetadata.participants : [];

    let user = msg.isGroup ? participants.find((u) => u.id == msg.author) : {};
    let bot = msg.isGroup
      ? participants.find((u) => u.id == Serializer.decodeJid(this.user.id))
      : {};

    let isAdmin = msg.isGroup
      ? user?.admin == "admin" || user?.admin == "superadmin"
      : false;
    let isBotAdmin = msg.isGroup ? bot?.admin : false;

    if (command.admin && !isAdmin) {
      return msg
        .react("⚠️")
        .then(() => msg.reply("This command can only executed by the admin!"));
    } else if (command.botAdmin && !isBotAdmin) {
      return msg
        .react("⚠️")
        .then(() =>
          msg.reply("Make sure the bot is admin before executing this command!")
        );
    } else if (msg.isGroup && command.private) {
      return msg
        .react("⚠️")
        .then(() =>
          msg.reply("This command can only executed in private chat!")
        );
    } else if (!msg.isGroup && command.group) {
      return msg
        .react("⚠️")
        .then(() => msg.reply("This command can only executed in group chat!"));
    } else if (command.owner && !isOwner) {
      return msg
        .react("⚠️")
        .then(() => msg.reply("This command can only executed by the owner!"));
    }

    // Execute the command requested by user
    let extra = {
      bot: this,
      usedPrefix,
      participants,
      groupMetadata,
      args,
    };
    try {
      await command.execute.call(this, msg, extra);
    } catch (error) {
      console.error(error);
      this.sendMessage(
        msg.key.remoteJid,
        {
          text: "There's some error while executing the command, please contact the owner to resolve this problem!",
        },
        { quoted: msg }
      );
    }
  },
};
