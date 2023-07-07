const { GenshinImpact, HonkaiStarRail, GamesEnum, REDEEM_CLAIM_API } = require("hoyoapi");

let handler = async (msg, { command, text }) => {
  if (!text) return msg.reply("Masukkan kode redeem!");
  let user = global.db.data.users[msg.author || msg.from];
  if (!user?.hoyolab?.cookieToken)
    return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
  msg.react("⚡");
  let result;
  try {
    let _game = command.split("redeemcode")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
    let cookieToken = user.hoyolab?.cookieToken[_game] ? user.hoyolab.cookieToken[_game] : user.hoyolab.cookieToken;
    if (!cookieToken) return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
    let options = { cookie: user.hoyolab.cookieToken, lang: "id", uid: user.hoyolab[_game].uid };
    let game = command.split("redeemcode")[0] == "gi" ? new GenshinImpact(options) : new HonkaiStarRail(options);
    if (command.includes("hsr")) {
      game.request.setQueryParams({
        uid: user.hoyolab[_game].uid,
        region: user.hoyolab[_game].server,
        game_biz: "hkrpg_global",
        cdkey: text.replace(/\uFFFD/g, ""),
        lang: "id",
        sLangKey: "id",
      });
      result = await (await game.request.send(REDEEM_CLAIM_API.replace("hk4e", "hkrpg").replace("hoyolab", "hoyoverse"))).response;
    } else result = await game.redeem.claim(text);
  } catch (e) {
    console.error(e);
    msg.reply(e);
    msg.reply("A error occured, please try again later.");
  } finally {
    msg.reply("```" + JSON.stringify(result, null, 2) + "```");
  }
};

handler.help = ["hsrredeemcode <code>", "giredeemcode <code>"];
handler.tags = ["hyv"];
handler.command = ["hsrredeemcode", "giredeemcode"];
module.exports = handler;
