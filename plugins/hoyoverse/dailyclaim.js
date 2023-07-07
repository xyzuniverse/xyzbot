const { GenshinImpact, HonkaiStarRail, GamesEnum, HonkaiImpact } = require("hoyoapi");

let handler = async (msg, { command }) => {
  let user = global.db.data.users[msg.author || msg.from];
  msg.reply("Just a moment...").then(async (message) => {
    var result;
    try {
      let _game =
        command.split("dailyclaim")[0] == "gi"
          ? GamesEnum.GENSHIN_IMPACT
          : command.split("dailyclaim")[0] == "hsr"
          ? GamesEnum.HONKAI_STAR_RAIL
          : GamesEnum.HONKAI_IMPACT;
      let cookieToken = user.hoyolab?.cookieToken[_game] ? user.hoyolab.cookieToken[_game] : user.hoyolab.cookieToken;
      if (!cookieToken) return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
      let options = { cookie: cookieToken, lang: "id-id", uid: user.hoyolab[_game].uid };
      let game =
        command.split("dailyclaim")[0] == "gi"
          ? new GenshinImpact(options)
          : command.split("dailyclaim")[0] == "hsr"
          ? new HonkaiStarRail(options)
          : new HonkaiImpact(options);
      result = await game.daily.claim();
    } catch (e) {
      console.error(e);
      msg.reply(e);
    } finally {
      if (result && result.code === 0) {
        delay(2000).then(async () => {
          return await message.edit(`Berhasil claim daily, silahkan login ke game untuk melanjutkan.`);
        });
      } else if (result && result.code === -5003) {
        delay(2000).then(async () => {
          return await message.edit(`${result.status}\nTerakhir anda mengklaim: x${result.reward.award.cnt} ${result.reward.award.name}`);
        });
      } else msg.reply("```" + JSON.stringify(result, null, 2) + "```");
    }
  });
};

handler.help = ["hsrdailyclaim", "gidailyclaim", "hi3dailyclaim"];
handler.tags = ["hyv"];
handler.command = ["hsrdailyclaim", "gidailyclaim", "hi3dailyclaim"];
module.exports = handler;

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
