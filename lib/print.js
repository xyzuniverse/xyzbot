const chalk = require("chalk");
const PhoneNumber = require("awesome-phonenumber");
const { WAMessageStubType } = require("baileys");

module.exports = async (conn, m) => {
  if (m.isGroup) groupMetadata = await conn.groupMetadata(m.chat);
  let sender = PhoneNumber(
    "+" +
      (m.fromMe
        ? conn.decodeJid(conn.user.id).replace("@s.whatsapp.net", "")
        : m.sender.replace("@s.whatsapp.net", ""))
  ).getNumber("international");
  let q_sender = PhoneNumber(
    "+" + m.sender.replace("@s.whatsapp.net", "")
  ).getNumber("international");
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
  // Header
  console.log(
    `${chalk.redBright(
      "~",
      conn.user.name,
      PhoneNumber(
        "+" + conn.decodeJid(conn.user.id).replace("@s.whatsapp.net", "")
      ).getNumber("international")
    )} ${chalk.black(
      chalk.bgYellow(
        (m.messageTimestamp
          ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp))
          : new Date()
        ).toTimeString()
      )
    )}`
  );
  console.log(
    `${chalk[pickRandom(colors)](
      "~ " + (m.fromMe ? conn.user.name : m.name),
      sender
    )} to ${
      m.isGroup
        ? "" +
          chalk.green(
            m.chat,
            groupMetadata.subject
          ) +
          ""
        : chalk.green(m.chat)
    } ${chalk.black(
      chalk.bgYellow(
        m.type
          .replace(/message$/i, "")
          .replace("audio", m.messageContent.ptt ? "PTT" : "audio")
          .replace(/^./, (v) => v.toUpperCase())
      )
    )}`
  );
  // Content
  if (m.quoted) {
    console.log("========== quotedMessage ==========");
    console.log(
      `| ${chalk[pickRandom(colors)]("~ " + q_sender)} ${chalk.black(
        chalk.bgYellow(
          m.quoted.type
            .replace(/message$/i, "")
            .replace("audio", m.messageContent.ptt ? "PTT" : "audio")
            .replace(/^./, (v) => v.toUpperCase())
        )
      )} ${m.quoted.text ? "\n| " + m.quoted.text : ""}`
    );
    console.log("===================================");
  }
  console.log(m.isCommand ? chalk.yellow(m.text) : m.text, "\n");
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
