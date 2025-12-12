import chalk from "chalk";
import { parsePhoneNumber } from "awesome-phonenumber";
import { areJidsSameUser } from "baileys";
import type { WASocket, GroupMetadata } from "baileys";
import { decodeJid } from './Serializer.ts';

// Helper function to format phone number
function formatPhone(number: string): string {
    try {
        const pn = parsePhoneNumber(number);
        return pn.number?.international || number;
    } catch {
        return number;
    }
}

export default async function (bot: WASocket & { db: any }, msg: any, groupMetadata: GroupMetadata) {
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
            .replace(/^./, (v: string) => v.toUpperCase())
        : "";

    // The header of the chat
    let header_bot =
        chalk.red(
            "~ " +
            bot.user?.name +
            " " +
            formatPhone("+" + decodeJid(bot.user?.id || "").split("@")[0])
        ) +
        " " +
        chalk.black(
            chalk.bgYellow(
                (msg.timestamp
                    ? new Date(1000 * (msg.messageTimestamp.low || msg.messageTimestamp))
                    : new Date()
                ).toTimeString()
            )
        );
    let header_sender =
        (chalk as any)[pickRandom(colors)](
            "~ " +
            (msg.key.fromMe ? bot.user?.name : msg.pushName) +
            " " +
            formatPhone(
                "+" +
                (msg.key.fromMe
                    ? decodeJid(bot.user?.id || "").split("@")[0]
                    : msg.sender.split("@")[0])
            )
        ) +
        " to " +
        chalk.green(
            msg.from +
            " " +
            (msg.isGroup
                ? groupMetadata.subject
                : areJidsSameUser(decodeJid(bot.user?.id || "").split("@")[0], msg.sender)
                    ? bot.user?.name
                    : msg.pushName)
        ) +
        " " +
        chalk.black(chalk.bgYellow(msgType));
    let text = msg.isCommand ? chalk.yellow(msg.text) : msg.text;
    if (msg.content?.contextInfo?.mentionedJid) {
        for (let users of msg.content.contextInfo.mentionedJid) {
            let name = bot.db.data.users[users]
                ? bot.db.data.users[users].name
                : areJidsSameUser(decodeJid(bot.user?.id || "").split("@")[0], users)
                    ? bot.user?.name
                    : formatPhone("+" + users.split("@")[0]);
            text = text.replace(
                "@" + users.split`@`[0],
                chalk.blueBright("@" + name)
            );
        }
    }
    return console.log(header_bot + "\n" + header_sender + "\n" + text + "\n");
};

function pickRandom(list: any[]) {
    return list[Math.floor(Math.random() * list.length)];
}
