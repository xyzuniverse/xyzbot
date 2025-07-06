const { hoyoverse } = require("../../lib/hoyolab-api.getuserinfo");
const { GamesEnum } = require("@rexprjkt/hoyoapi");

module.exports = {
  name: "gisetserver",
  alias: ["hsrsetserver", "hi3setserver"],
  description: "Set in-game server on your hoyoverse account.",
  execute: async (msg, { bot, args, command }) => {
    let text = args.join(" ");
    let user = bot.db.data.users[msg.sender || msg.from];
    try {
      let _game =
        command.split("setserver")[0] == "gi"
          ? GamesEnum.GENSHIN_IMPACT
          : command.split("setserver")[0] == "hi3"
          ? GamesEnum.HONKAI_IMPACT
          : GamesEnum.HONKAI_STAR_RAIL;
      let cookieToken = user.hoyolab?.cookieToken[_game]
        ? user.hoyolab.cookieToken[_game]
        : user.hoyolab.cookieToken;
      if (!cookieToken)
        return msg.reply(
          "Cookie token not found! Please generate it from hoyoverse website.\nTutorial coming soon."
        );
      let _user = new hoyoverse({ cookie: cookieToken });
      let game = await (await _user.getUserAccountInfo()).response.data.list;
      let user_data = game.find(
        (v) =>
          v.region ==
          (command.split("setserver")[0] === "hi3"
            ? HI3RecognizeServer(text.toLowerCase())
            : recognizeServer(_game, text.toLowerCase()))
      );
      if (user_data) {
        user.hoyolab[_game] = {
          uid: user_data.game_uid,
          server: user_data.region,
          nickname: user_data.nickname,
        };
        await bot.db.write();
        msg.reply(`Successfuly set server into ${text}.`);
      } else {
        if (!command.includes("hi3")) {
          return msg.reply(
            "Invalid format! List server available:\n* Asia\n* Europe\n* America\n* Taiwan/Hongkong/Macao (pilih salah satu)"
          );
        } else {
          return msg.reply(
            "Invalid format! List server available:\n* USA\n* Europe\n* Asia"
          );
        }
      }
    } catch (e) {
      msg.reply(e.toString());
      msg.reply("A error occured, please try again.");
    }
  },
};

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

function HI3RecognizeServer(str) {
  switch (str) {
    case "usa":
      return "usa01";
    case "europe":
      return "eur01";
    case "asia":
      return "overseas01";
    default:
      return "";
  }
}
