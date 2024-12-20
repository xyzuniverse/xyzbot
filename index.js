const client = require("./lib/client");
const Serializer = require("./lib/Serializer");
const Collection = require("./lib/CommandCollections");
const fs = require("fs");
const path = require("node:path");
const chokidar = require("chokidar");

// Prevent exit if it's closed
process.on("uncaughtException", console.error);

async function start() {
  const sessionDir = "sessions"; // Change anything if u want
  const bot = await client.connect(sessionDir);

  // Command manager
  bot.commands = new Collection();

  // Load the commands
  const loadCommands = (dir) => {
    bot.commands.clear();
    const commandsPath = path.join(__dirname, dir);
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        delete require.cache[require.resolve(filePath)];
        try {
          const command = require(filePath);
          bot.commands.set(command.name, command);
        } catch (error) {
          console.error(`Failed to load command from: ${filePath}:`, error);
        }
      }
    }
    console.log(
      `All commands has been loaded. Total commands: ${bot.commands.size}`
    );
  };

  loadCommands("commands");

  // Watch the commands folder if there's some changes
  const watcher = chokidar.watch("./commands", {
    ignored: /^\./, // Abaikan file yang diawali dengan titik (.)
    persistent: true,
    ignoreInitial: true, // Jangan load saat pertama kali dijalankan
  });

  watcher
    .on("add", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been added, reloading commands...`);
        loadCommands("commands");
      }
    })
    .on("change", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been changed, reloading commands...`);
        loadCommands("commands");
      }
    })
    .on("unlink", (filePath) => {
      if (filePath.endsWith(".js")) {
        console.log(`File ${filePath} has been removed, reloading commands...`);
        loadCommands("commands");
      }
    });

  // Message event
  bot.ev.on("messages.upsert", (messages) => {
    const msg = Serializer.serializeMessage(bot, messages.messages[0]);
    console.log(JSON.stringify(msg, null, 2));
    if (!msg.message) return;

    // Command handling
    const botPrefix = new RegExp(
      "^[" +
        "‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(
          /[|\\{}()[\]^$+*?.\-\^]/g,
          "\\$&"
        ) +
        "]"
    );
    let usedPrefix = msg.text.match(botPrefix)?.[0];
    if (!usedPrefix) return; // If no prefix is found, exit

    const args = msg.text.slice(usedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!bot.commands.has(commandName))
      return msg.reply(
        `Unknown command: ${commandName}\n... maybe try see ${usedPrefix}menu for check some commands list?`
      );
    const command = bot.commands.get(commandName);

    try {
      command.execute(msg, {
        args,
        bot,
        usedPrefix,
      });
    } catch (error) {
      console.error(error);
      bot.sendMessage(
        msg.key.remoteJid,
        {
          text: "There's some error while executing the command, please contact the owner to resolve this problem!",
        },
        { quoted: msg }
      );
    }
  });

  return bot;
}

start().catch(() => console.error);
