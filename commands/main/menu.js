module.exports = {
  name: "menu",
  description: "Show the command list.",
  execute: async (msg, { bot, usedPrefix }) => {
    let categorizedCommands = {};
    for (const [commandName, commandData] of bot.commands) {
      const category = commandData.category;
      if (!categorizedCommands[category]) {
        categorizedCommands[category] = [];
      }
      categorizedCommands[category].push({
        name: commandName,
        description: commandData.description,
      });
    }

    let menuText = "/// COMMAND LIST ///\n\n";
    for (const category in categorizedCommands) {
      menuText += `*${
        category.toString().charAt(0).toUpperCase() + category.slice(1)
      }*\n`;
      for (const command of categorizedCommands[category]) {
        menuText += `- \`\`\`${usedPrefix}${command.name}\`\`\`: ${command.description}\n`;
      }
      menuText += "\n"; // Add a blank line for next category
    }
    return msg.reply(menuText);
  },
};
