let handler = async (msg, { client }) => {
  try {
    var link = await client.groupInviteCode(msg.from);
    client.sendMessage(msg.from, { text: "Here's your group invite link: https://chat.whatsapp.com/" + link }, { quoted: msg });
  } catch (e) {
    msg.reply("A error occured, please try again.");
  }
};

handler.group = true;

handler.admin = true;
handler.botAdmin = true;

handler.command = /^(linkgc)$/i;

module.exports = handler;
