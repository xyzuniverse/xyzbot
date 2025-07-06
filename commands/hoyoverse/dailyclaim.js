const {
  GenshinImpact,
  HonkaiStarRail,
  GamesEnum,
  HonkaiImpact,
} = require("@rexprjkt/hoyoapi");

module.exports = {
  name: "gidailyclaim",
  alias: ["hsrdailyclaim", "hi3dailyclaim"],
  description: "Claim daily check-in on your hoyoverse games.",
  execute: async (msg, { bot, command }) => {
    let user = bot.db.data.users[msg.sender || msg.from];
    msg.reply("Just a moment...").then(async (message) => {
      var result;
      try {
        let _game =
          command.split("dailyclaim")[0] == "gi"
            ? GamesEnum.GENSHIN_IMPACT
            : command.split("dailyclaim")[0] == "hsr"
            ? GamesEnum.HONKAI_STAR_RAIL
            : GamesEnum.HONKAI_IMPACT;
        let cookieToken = user.hoyolab?.cookieToken[_game]
          ? user.hoyolab.cookieToken[_game]
          : user.hoyolab.cookieToken;
        if (!cookieToken)
          return msg.reply(
            "Cookie token not found! Please generate it from hoyoverse website.\nTutorial coming soon."
          );
        let options = {
          cookie: cookieToken,
          lang: "id-id",
          uid: user.hoyolab[_game].uid,
        };
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
            return await message.edit(
              `Daily check-in has been claimed, check your in-game messages.`
            );
          });
        } else if (result && result.code === -5003) {
          delay(2000).then(async () => {
            return await message.edit(
              `${result.status}\nLast item claimed: x${result.reward.award.cnt} ${result.reward.award.name}`
            );
          });
        } else msg.reply("```" + JSON.stringify(result, null, 2) + "```");
      }
    });
  },
};

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
