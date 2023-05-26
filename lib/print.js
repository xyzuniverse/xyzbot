const chalk = require("chalk");
const PhoneNumber = require("awesome-phonenumber");
const { serializeJid } = require("./helper");
const { areJidsSameUser } = require("@whiskeysockets/baileys");

module.exports = async function (client, msg) {
  let colors = [
    "red",
    "green",
    "blue",
    "yellow",
    "magenta",
    "cyan",
    "redBright",
    "greenBright",
    "blueBright",
    "yellowBright",
    "magentaBright",
    "cyanBright",
  ];

  var msgType = msg.type
    ? msg.type
        .replace(/message$/i, "")
        .replace("audio", msg.content.ptt ? "PTT" : "audio")
        .replace(/^./, (v) => v.toUpperCase())
    : "";

  // The header of the chat
  let header_client =
    chalk.red("~ " + client.user.name + " " + PhoneNumber("+" + serializeJid(client.user.id).split("@")[0]).getNumber("international")) +
    " " +
    chalk.black(chalk.bgYellow((msg.timestamp ? new Date(1000 * (msg.messageTimestamp.low || msg.messageTimestamp)) : new Date()).toTimeString()));
  let header_sender =
    chalk[pickRandom(colors)]("~ " + msg.pushName + " " + PhoneNumber("+" + msg.author.split("@")[0]).getNumber("international")) +
    " to " +
    chalk.green(
      msg.from +
        " " +
        (msg.isGroup
          ? await (
              await client.groupMetadata(msg.from)
            ).subject
          : areJidsSameUser(client.user.id, msg.author)
          ? client.user.name
          : msg.pushName)
    ) +
    " " +
    chalk.black(chalk.bgYellow(msgType));
  let text = msg.isCommand ? chalk.yellow(msg.body) : msg.body;
  if (msg.mentionedJid) {
    for (let users of msg.mentionedJid) {
      let name = global.db.data.users[users]
        ? global.db.data.users[users].name
        : areJidsSameUser(serializeJid(client.user.id), users)
        ? client.user.name
        : PhoneNumber("+" + users.split("@")[0]).getNumber("international");
      text = text.replace("@" + users.split`@`[0], chalk.blueBright("@" + name));
    }
  }
  return console.log(header_client + "\n" + header_sender + "\n" + text + "\n");
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

let file = require.resolve(__filename);
let fs = require("fs");
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update 'lib/print.js'"));
  delete require.cache[file];
  require(file);
});
