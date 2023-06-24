const { Genshin, HonkaiStarRail, GamesEnum, Route } = require("@vermaysha/hoyolab-api");

let handler = async (msg, { command, text }) => {
  if (!text) return msg.reply("Masukkan kode redeem!");
  let user = global.db.data.users[msg.author];
  if (!user?.hoyolab?.cookieToken)
    return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
  msg.react("⚡");
  var result;
  try {
    let _game = command.split("redeemcode")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
    let options = { cookie: user.hoyolab.cookieToken, lang: "id", uid: user.hoyolab[_game].uid, region: user.hoyolab[_game].server };
    let game = command.split("redeemcode")[0] == "gi" ? new Genshin(options) : new HonkaiStarRail(options);
    if (command.includes("hsr")) {
      game.request.setParams({
        uid: user.hoyolab[_game].uid,
        region: user.hoyolab[_game].server,
        game_biz: "hkrpg_global",
        cdkey: text.replace(/\uFFFD/g, ""),
        lang: "id",
        sLangKey: "id",
      });
      result = await game.request.send(Route.GENSHIN_REDEEM_CODE.replace("hk4e", "hkrpg").replace("hoyolab", "hoyoverse"));
    } else result = await game.redeemCode(text);
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
