module.exports = {
  name: "ping",
  description: "Respond with a pong!",
  execute: async (msg, { args, bot }) => {
    return msg.reply("Pong!");
  },
};
