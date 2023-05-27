let handler = async (msg, { client }) => {
  try {
    msg.react("⏳");
    var link = await client.groupRevokeInvite(msg.from);
    if (link) {
      msg.react("✅");
      msg.reply("Successfully revoke the group invite link, please check the into PM.");
      client.sendMessage(msg.author, { text: "New group invite link: https://chat.whatsapp.com/" + link }, { quoted: msg });
    }
  } catch (e) {
    msg.reply("A error occured, please try again.");
  }
};

handler.group = true;

handler.admin = true;
handler.botAdmin = true;

handler.command = /^(gcrevokelink)$/i;

module.exports = handler;
