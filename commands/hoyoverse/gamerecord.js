const {
  GenshinImpact,
  HonkaiStarRail,
  GamesEnum,
} = require("@rexprjkt/hoyoapi");

module.exports = {
  name: "gigamerecord",
  alias: ["hsrgamerecord"],
  description: "Check your ingame progress on your hoyoverse games.",
  execute: async (msg, { bot, command }) => {
    let user = bot.db.data.users[msg.sender || msg.from];
    msg.reply("Just a moment...").then(async (message) => {
      var result;
      var str;
      try {
        let _game =
          command.split("gamerecord")[0] == "gi"
            ? GamesEnum.GENSHIN_IMPACT
            : GamesEnum.HONKAI_STAR_RAIL;
        let cookieToken = user.hoyolab?.cookieToken[_game]
          ? user.hoyolab.cookieToken[_game]
          : user.hoyolab.cookieToken;
        if (!cookieToken)
          return msg.reply(
            "Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon."
          );
        let options = {
          cookie: user.hoyolab.cookieToken,
          lang: "id-id",
          uid: user.hoyolab[_game].uid,
        };
        let game =
          command.split("gamerecord")[0] == "gi"
            ? new GenshinImpact(options)
            : new HonkaiStarRail(options);
        result = await (await game.record.records()).stats;
      } catch (e) {
        console.error(e);
        msg.reply(e);
        msg.reply("A error occured, please try again later.");
      } finally {
        if (command.startsWith("hsr")) {
          str =
            "```" +
            `${result.active_days} Days active\n${
              result.avatar_num
            } Characters unlocked\n${
              result.achievement_num
            } Achivement unlocked\n${result.chest_num} Treasures Opened\n${
              result.abyss_process.split("<unbreak>")[1].split("<")[0]
            } ${result.abyss_process.split("<unbreak>")[0]}Forgotten Hall` +
            "```";
        } else {
          str =
            "```" +
            `${result.active_day_number} Days active\n${
              result.achievement_number
            } Achivement unlocked\n${
              result.anemoculus_number
            } Anemoculus obtained\n${
              result.geoculus_number
            } Geoculus obtained\n${
              result.electroculus_number
            } Electroculus obtained\n${
              result.dendroculus_number
            } Dendroculus obtained\n${
              result.avatar_number
            } Character unlocked\n${
              result.way_point_number
            } Teleport waypoint unlocked\n${
              result.domain_number
            } Domain unlocked\n${result.spiral_abyss} Last spiral abyss\n${
              result.precious_chest_number +
              result.luxurious_chest_number +
              result.exquisite_chest_number +
              result.common_chest_number +
              result.magic_chest_number
            } Chest unlocked` +
            "```";
        }
        delay(2000).then(async () => {
          return await message.edit(str);
        });
      }
    });
  },
};

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
