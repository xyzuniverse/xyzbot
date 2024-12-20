module.exports = {
  name: "ping",
  execute: async (msg, args, bot) => {
    return msg.reply("Pong!");
  },
};
