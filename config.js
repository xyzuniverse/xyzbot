global.owner = [
  // [number, name, isDev?]
  ["628123456789", "name", true],
];

global.sticker = {
  packname: "xyzbot's stickers.",
  author: "xyzbot - based on wwjs.",
};

global.apiKey = {
  sagiri: "", // Insert your apikey here
};

let file = require.resolve(__filename);
let fs = require("fs");
let chalk = require("chalk");
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update 'config.js'"));
  delete require.cache[file];
  require(file);
});
