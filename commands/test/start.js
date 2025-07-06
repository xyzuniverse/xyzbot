module.exports = {
  name: "start",
  description: "Returns some greetings from the bot.",
  execute: async (msg, { args, bot, usedPrefix }) => {
    msg.react("👋").then(() => {
      msg.reply(
        `Hi there, how can i help? You can use ${usedPrefix}menu for showing command list.`
      );
    });
  },
};
