const client = require("./lib/client");
const Serializer = require("./lib/Serializer");

// Prevent exit if it's closed
process.on("uncaughtException", console.error);

async function start() {
  const sessionDir = "sessions"; // Change anything if u want
  const bot = await client.connect(sessionDir);

  // Message event
  bot.ev.on("messages.upsert", (messages) => {
    const msg = Serializer.serializeMessage(bot, messages.messages[0]);
    console.log(JSON.stringify(msg, null, 2));
    if (msg.text.toLowerCase() === "test") {
      msg.react("🏓");
      msg.reply("Pong!");
    }
  });

  return bot;
}

start().catch(() => console.error);
