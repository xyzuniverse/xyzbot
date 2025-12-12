import { Cookie, GamesEnum } from "@rexprjkt/hoyoapi";
import { hoyoverse } from "../../lib/hoyolab-api.getuserinfo.ts";
import type { WASocket } from "baileys";

export default {
    name: "hoyoversegetcookie",
    alias: ["gigetcookie", "hi3getcookie", "hsrgetcookie"],
    description: "Login your cookie token to using hoyoverse features.",
    execute: async (msg: any, { bot, args, command, usedPrefix }: { bot: WASocket & { db: any }, args: string[], command: string, usedPrefix: string }) => {
        let text = args.join(" ");
        if (!text)
            return msg.reply(
                `Insert the cookie token!\nNOTE: Now cookie tokens can be separated if your account is different for each game platform,\nJust fill it with ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nOr if your account is linked to all game platforms into one account, just type ${usedPrefix}hoyoversegetcookie.`
            );
        msg.reply("Just a moment...").then(async (message: any) => {
            let _game =
                command.split("getcookie")[0] == "gi"
                    ? GamesEnum.GENSHIN_IMPACT
                    : command.split("getcookie")[0] == "hsr"
                        ? GamesEnum.HONKAI_STAR_RAIL
                        : command.split("getcookie")[0] == "hi3"
                            ? GamesEnum.HONKAI_IMPACT
                            : null;
            let result;
            try {
                result = Cookie.parseCookieString(text);
            } catch (e: any) {
                return msg.reply(e.toString());
            } finally {
                if (result) {
                    let user = bot.db.data.users[msg.from || msg.sender];
                    if (!("hoyolab" in user)) user.hoyolab = {};
                    if (_game) {
                        user.hoyolab = {
                            cookieToken: {
                                [_game]: result,
                            },
                        };
                    } else user.hoyolab.cookieToken = result;
                    let client = new hoyoverse({
                        cookie: result,
                    });
                    let _userinfo = await client.getUserAccountInfo();
                    if (!_userinfo.response.data)
                        return await message.reply(
                            "```" + JSON.stringify(_userinfo) + "```"
                        );
                    await bot.db.write();
                    delay(2000).then(async () => {
                        if (command.includes("hoyoverse")) {
                            return await message.edit(
                                `The cookie token has been saved, please type the command ${usedPrefix}gisetserver/${usedPrefix}hi3setserver/${usedPrefix}hsrsetserver <selected server> to make some hoyoverse API features more accurate.\nNOTE: Now the cookie token can be separated if your account is different for each game platform,\nJust fill it with ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nOr if your account is linked to all game platforms into one account, just type ${usedPrefix}hoyoversegetcookie.`
                            );
                        } else
                            return await message.edit(
                                `Cookie token has been saved, please type command ${usedPrefix}${command.split("getcookie")[0]
                                }setserver <selected server> to make some hoyoverse API features more accurate.\nNOTE: Now cookie token can be separated if your account is different for each game platform,\nJust fill it with ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nOr if your account is linked to all game platforms into one account, just type ${usedPrefix}hoyoversegetcookie.`
                            );
                    });
                } else
                    return msg.reply(
                        "A error occured, maybe cookie token didn't included properly.\nPlease try again."
                    );
            }
        });
    },
};

function delay(milliseconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
