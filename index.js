const client = require("./lib/client");

async function start() {
  const sessionDir = "sessions"; // Change anything if u want
  const bot = await client.connect(sessionDir);

  // Message event
  bot.ev.on("messages.upsert", (m) => {
    console.log(JSON.stringify(m, null, 2));
  });

  return bot;
}

start().catch(() => console.error);
