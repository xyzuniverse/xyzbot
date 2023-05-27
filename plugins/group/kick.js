const { serializeJid } = require("../../lib/helper");
let handler = async (msg, { client }) => {
  let ownerGroup = msg.from.split`-`[0] + "@s.whatsapp.net";
  let users = msg.mentionedJid.filter((u) => !(u == ownerGroup || u.includes(serializeJid(client.user.id))));
  if (!msg.mentionedJid) return msg.reply("Mention the users that you want to kick.");
  try {
    for (let user of users) if (user.endsWith("@s.whatsapp.net")) await client.groupParticipantsUpdate(msg.from, [user], "remove");
  } catch (e) {
    console.error(e);
    return msg.reply("Failed to kick some members, please try again!");
  }
};

handler.group = true;

handler.admin = true;
handler.botAdmin = true;

module.exports = handler;
