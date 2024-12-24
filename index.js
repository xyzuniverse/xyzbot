require("dotenv").config();
const client = require("./lib/client");
const Serializer = require("./lib/Serializer");
const Collection = require("./lib/CommandCollections");
const fs = require("fs");
const path = require("node:path");
const chokidar = require("chokidar");
const { DisconnectReason } = require("@whiskeysockets/baileys");

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
          command.category = folder;
          bot.commands.set(command.name, command); // Set the main name

          if (command.alias && Array.isArray(command.alias)) {
            command.alias.forEach((alias) => bot.commands.set(alias, command)); // Set aliases
          }
        } catch (error) {
          console.error(`Failed to load command from: ${filePath}:`, error);
        }
      }
    }
    console.log(bot.commands);
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

  chokidar
    .watch("./.env", {
      persistent: true,
      ignoreInitial: true,
    })
    .on("change", () => {
      console.log("File .env has been changed, reloading configs...");
      require("dotenv").config({ override: true });
    });

  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("connection closed");
      if (
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      ) {
        await start();
      } else {
        console.log("Connection closed. You are logged out.");
      }
    }

    console.log("connection update", update);
  });

  return bot;
}

start().catch(() => console.error);
