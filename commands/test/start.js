module.exports = {
  name: "start",
  execute: async (msg, { args, bot, usedPrefix }) => {
    msg.react("👋").then(() => {
      msg.reply(
        `Hi there, how can i help? You can use ${usedPrefix}menu for showing command list.`
      );
    });
  },
};
