import {
    GenshinImpact,
    HonkaiStarRail,
    GamesEnum,
    REDEEM_CLAIM_API,
} from "@rexprjkt/hoyoapi";
import type { WASocket } from "baileys";

export default {
    name: "giredeemcode",
    alias: ["hsrredeemcode"],
    description: "Claim redeem code on your hoyoverse games.",

    execute: async (msg: any, { command, args, bot }: { command: string, args: string[], bot: WASocket & { db: any } }) => {
        let text = args.join(" ");
        if (!text) return msg.reply("Enter the redeem code!");
        let user = bot.db.data.users[msg.sender || msg.from];
        if (!user?.hoyolab?.cookieToken)
            return msg.reply(
                "Cookie token not found! Please generate it from hoyoverse website.\nTutorial coming soon."
            );
        msg.react("⚡");
        let result;
        try {
            let _game =
                command.split("redeemcode")[0] == "gi"
                    ? GamesEnum.GENSHIN_IMPACT
                    : GamesEnum.HONKAI_STAR_RAIL;
            let options = {
                cookie: user.hoyolab.cookieToken,
                lang: "id" as any,
                uid: user.hoyolab[_game].uid,
            };
            let game =
                command.split("redeemcode")[0] == "gi"
                    ? new GenshinImpact(options)
                    : new HonkaiStarRail(options);
            if (command.includes("hsr")) {
                (game as any).request.setQueryParams({
                    uid: user.hoyolab[_game].uid,
                    region: user.hoyolab[_game].server,
                    game_biz: "hkrpg_global",
                    cdkey: text.replace(/\uFFFD/g, ""),
                    lang: "id" as any,
                    sLangKey: "id",
                });
                result = await (
                    await (game as any).request.send(
                        REDEEM_CLAIM_API.replace("hk4e", "hkrpg").replace(
                            "hoyolab",
                            "hoyoverse"
                        )
                    )
                ).response;
            } else result = await game.redeem.claim(text);
        } catch (e: any) {
            console.error(e);
            msg.reply(e.toString());
            msg.reply("A error occured, please try again later.");
        } finally {
            msg.reply("```" + JSON.stringify(result, null, 2) + "```");
        }
    },
};
