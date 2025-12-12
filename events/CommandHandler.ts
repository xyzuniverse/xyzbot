import type { WASocket } from "baileys";
import { serializeMessage, decodeJid } from "../lib/Serializer.ts";
import { getGroupMetadata } from "../lib/CachedGroupMetadata.ts";
import DatabaseHandler from "./DatabaseHandler.ts";
import AFKHandler from "./AFKHandler.ts";
import printMessage from "../lib/print.ts";
import { exec } from "child_process";
import util from "util";

export default {
    async chatUpdate(this: WASocket & { commands: Map<string, any>; db: any; sendMessage: any; user: any }, messages: any) {
        const msg = await serializeMessage(this, messages.messages[0]);

        try {
            if (!msg.message) return;
            if (msg.isBaileys) return;

            // Database
            DatabaseHandler(msg, this);

            // AFK
            AFKHandler(msg, this);

            // Midman - prevent user to run command if the user doesn't have the permission
            let isROwner = [this.user.id.split("@")[0], process.env.owner]
                .map((v) => v?.replace(/[^0-9]/g, ""))
                .includes(msg.sender.split("@")[0]);
            let isOwner = isROwner || msg.key.fromMe;
            let groupMetadata = msg.isGroup ? await getGroupMetadata(msg.from, this) : {};
            let participants = msg.isGroup ? (groupMetadata as any).participants : [];
            let user = msg.isGroup ? participants.find((u: any) => u.id == msg.sender) : {};
            let bot = msg.isGroup ? participants.find((u: any) => u.id == decodeJid(this.user.id)) : {};
            let isAdmin = msg.isGroup ? user?.admin == "admin" || user?.admin == "superadmin" : false;
            let isBotAdmin = msg.isGroup ? bot?.admin : false;

            // Eval - debugging
            if (msg.text.startsWith("=> ") && isOwner) {
                try {
                    let evaled = await eval(msg.text.slice(2));
                    if (typeof evaled !== "string") evaled = util.inspect(evaled);
                    return msg.reply(evaled.toString());
                } catch (error: any) {
                    console.log(error);
                    return msg.reply(error.toString());
                }
            } else if (msg.text.startsWith("$ ") && isOwner) {
                msg.reply("Executing...").then((message: any) => {
                    setTimeout(() => {
                        exec(msg.text.slice(2), (err, stdout) => {
                            if (err) return message.edit(err);
                            if (stdout) return message.edit(stdout.toString());
                        });
                    }, 2000);
                });
            } else {
                // Command handling
                const botPrefix = new RegExp(
                    "^[" + "/!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]"
                );
                let usedPrefix = msg.text.match(botPrefix)?.[0];
                if (!usedPrefix) return; // If no prefix is found, exit

                const args = msg.text.slice(usedPrefix.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();
                if (!commandName) return;
                if (!this.commands.has(commandName)) return;
                const command = this.commands.get(commandName);
                msg.isCommand = true;

                if (command.admin && !isAdmin) {
                    return msg.react("⚠️").then(() => msg.reply("This command can only executed by the admin!"));
                } else if (command.botAdmin && !isBotAdmin) {
                    return msg.react("⚠️").then(() => msg.reply("Make sure the bot is admin before executing this command!"));
                } else if (msg.isGroup && command.private) {
                    return msg.react("⚠️").then(() => msg.reply("This command can only executed in private chat!"));
                } else if (!msg.isGroup && command.group) {
                    return msg.react("⚠️").then(() => msg.reply("This command can only executed in group chat!"));
                } else if (command.owner && !isOwner) {
                    return msg.react("⚠️").then(() => msg.reply("This command can only executed by the owner!"));
                }

                // Execute the command requested by user
                let extra = {
                    bot: this,
                    usedPrefix,
                    participants,
                    groupMetadata,
                    args,
                    command: commandName,
                };
                try {
                    await command.execute.call(this, msg, extra);
                } catch (error) {
                    console.error(error);
                    this.sendMessage(
                        msg.key.remoteJid,
                        {
                            text: "There's some error while executing the command, please contact the owner to resolve this problem!",
                        },
                        { quoted: msg }
                    );
                }
            }
        } finally {
            printMessage(this, msg, msg.isGroup ? await getGroupMetadata(msg.from, this) as any : {});
        }
    },
};
