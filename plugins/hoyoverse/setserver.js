const { hoyoverse } = require("../../lib/hoyolab-api.getuserinfo");
const { GamesEnum } = require("@vermaysha/hoyolab-api");

let handler = async (msg, { client, args, text, command }) => {
  let user = global.db.data.users[msg.author];
  if (!user?.hoyolab?.cookieToken)
    return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
  try {
    let _user = new hoyoverse({ cookie: user.hoyolab.cookieToken });
    let _game = await (await _user.getUserAccountInfo()).data.list;
    let game = command.split("setserver")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
    let user_data = _game.find((v) => v.region == recognizeServer(game, text.toLowerCase()));
    if (user_data) {
      user.hoyolab[game] = {
        uid: user_data.game_uid,
        server: user_data.region,
        nickname: user_data.nickname,
      };
      await global.db.write();
      msg.reply(`Sukses mengatur server ke ${text}.`);
    } else return msg.reply("Format salah! List server yang tersedia:\n* Asia\n* Europe\n* America\n* Taiwan/Hongkong/Macao (pilih salah satu)");
  } catch (e) {
    msg.reply(e.toString());
    msg.reply("A error occured, please try again.");
  }
};

handler.help = ["hsrsetserver <server>", "gisetserver <server>"];
handler.tags = ["hyv"];
handler.command = ["hsrsetserver", "gisetserver"];
module.exports = handler;

function recognizeServer(game, str) {
  var code = game == GamesEnum.GENSHIN_IMPACT ? "os_" : "prod_official_";
  switch (str) {
    case "asia":
      return code + "asia";
    case "europe":
      return code + "euro";
    case "america":
      return code + "usa";
    case "taiwan":
    case "hongkong":
    case "macao":
      return code + "cht";
    default:
      return "";
  }
}
