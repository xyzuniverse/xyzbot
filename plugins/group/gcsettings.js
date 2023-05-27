let handler = async (msg, { client, args, command, usedPrefix }) => {
  let text = args.slice(1).join(" ");
  switch (args[0]) {
    case "lock":
    case "unlock":
      try {
        await client.groupSettingUpdate(msg.from, args[0] === "lock" ? "announcement" : "not_announcement");
      } catch (e) {
        console.error(e);
        msg.react("⚠️");
        return msg.reply("An error occured, please try again later.");
      } finally {
        msg.react("✅");
        msg.reply("Group " + args[0] + "ed.");
      }
      break;
    case "setname":
    case "setsubject":
      if (!text) {
        msg.react("⚠️");
        msg.reply("Insert a text or subject for the name of the group.");
      }
      try {
        await client.groupUpdateSubject(msg.from, text);
      } catch (e) {
        console.error(e);
        msg.reply("An error occured, please try again later.");
      } finally {
        msg.react("✅");
        msg.reply("Successfully changed the group subject.");
      }
      break;
    case "setdesc":
    case "setdescription":
      if (!text) {
        msg.react("⚠️");
        msg.reply("Insert a text for the description of the group.");
      }
      try {
        await client.groupUpdateDescription(msg.from, text);
      } catch (e) {
        console.error(e);
        msg.reply("An error occured, please try again later.");
      } finally {
        msg.react("✅");
        msg.reply("Successfully changed the group description.");
      }
      break;
    default:
      return msg.reply(
        `List group settings command:\n* ${usedPrefix + command} lock\n* ${usedPrefix + command} unlock\n* ${
          usedPrefix + command
        } setname <name group>\n* ${usedPrefix + command} setsubject <name group>\n* ${usedPrefix + command} setdesc <desc>\n* ${
          usedPrefix + command
        } setdescription <desc>`
      );
  }
};

handler.group = true;
handler.admin = true;
handler.botAdmin = true;

handler.command = /^(group)$/i;

module.exports = handler;
