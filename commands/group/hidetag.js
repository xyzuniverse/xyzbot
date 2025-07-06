module.exports = {
  name: "hidetag",
  description: "Silently tag all group members with your message.",
  group: true,
  admin: true,
  botAdmin: true,
  execute: async (msg, { bot, args, participants }) => {
    const members = participants
      .filter((participant) => participant.admin !== "superadmin" && participant.admin !== "admin")
      .map((participant) => participant.id);
    return bot.sendMessage(msg.from, { text: args.join(" "), mentions: members });
  },
};
