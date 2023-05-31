const { Genshin, HonkaiStarRail, GamesEnum } = require("@vermaysha/hoyolab-api");

let handler = async (msg, { command }) => {
  let user = global.db.data.users[msg.author];
  if (!user?.hoyolab?.cookieToken)
    return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
  var result;
  try {
    let _game = command.split("dailyclaim")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
    let options = { cookie: user.hoyolab.cookieToken, lang: "id-id", uid: user.hoyolab[_game].uid };
    let game = command.split("dailyclaim")[0] == "gi" ? new Genshin(options) : new HonkaiStarRail(options);
    result = await game.dailyClaim();
  } catch (e) {
    console.error(e);
    msg.reply(e);
    msg.reply("A error occured, please try again later.");
  } finally {
    if (result && result.code === 0) {
      msg.reply(`Berhasil claim daily, silahkan login ke game untuk melanjutkan.`);
    } else if (result && result.code === -5003) {
      msg.reply(`${result.status}\nTerakhir anda mengklaim: x${result.reward.award.cnt} ${result.reward.award.name}`);
    } else msg.reply("```" + JSON.stringify(result, null, 2) + "```");
  }
};

handler.help = ["hsrdailyclaim", "gidailyclaim"];
handler.tags = ["hyv"];
handler.command = ["hsrdailyclaim", "gidailyclaim"];
module.exports = handler;
