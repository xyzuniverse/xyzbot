const {
  GenshinImpact,
  HonkaiStarRail,
  GamesEnum,
} = require("@rexprjkt/hoyoapi");

module.exports = {
  name: "gidailynote",
  alias: ["hsrdailynote"],
  description: "Check your ingame progress on your hoyoverse games.",
  execute: async (msg, { bot, command }) => {
    let user = bot.db.data.users[msg.sender || msg.from];
    var result;
    var str;
    msg.reply("Just a moment...").then(async (message) => {
      try {
        let _game =
          command.split("dailynote")[0] == "gi"
            ? GamesEnum.GENSHIN_IMPACT
            : GamesEnum.HONKAI_STAR_RAIL;
        let cookieToken = user.hoyolab?.cookieToken[_game]
          ? user.hoyolab.cookieToken[_game]
          : user.hoyolab.cookieToken;
        if (!cookieToken)
          return msg.reply(
            "Cookie token not found! Please generate it from hoyoverse website.\nTutorial coming soon."
          );
        let options = {
          cookie: user.hoyolab.cookieToken,
          lang: "id-id",
          uid: user.hoyolab[_game].uid,
        };
        let game =
          command.split("dailynote")[0] == "gi"
            ? new GenshinImpact(options)
            : new HonkaiStarRail(options);
        result =
          command.split("dailynote")[0] == "gi"
            ? await game.record.dailyNote()
            : await game.record.note();
      } catch (e) {
        console.error(e);
        msg.reply("A error occured, please try again later.");
      } finally {
        if (result) message.edit("Done! Getting data...");
        if (command.startsWith("hsr")) {
          let _expeditions = [];
          let {
            current_stamina,
            max_stamina,
            stamina_recover_time,
            accepted_epedition_num,
            total_expedition_num,
            expeditions,
          } = result;
          expeditions.forEach((avatar) => {
            _expeditions.push(
              `- ${avatar.name}, Status: ${
                avatar.status === "Finished"
                  ? "Done, not claimed yet"
                  : "Still ongoing"
              }${
                avatar.status === "Finished"
                  ? ""
                  : `, ETA: ${toHoursAndMinutes(avatar.remaining_time)}`
              }`
            );
          });
          str =
            "```" +
            `Current Trailblazer Power: ${current_stamina}/${max_stamina}${
              stamina_recover_time === 0
                ? ", Already full"
                : `, ${toHoursAndMinutes(stamina_recover_time)} until full`
            }\nTrailblazer Power backup: ${
              result.current_reserve_stamina
            }/2400\nImplementation Tasks (${accepted_epedition_num}/${total_expedition_num})\nExpeditions/Tasks:\n${_expeditions.join(
              "\n"
            )}` +
            "```";
        } else {
          let _giexpeditions = [];
          let {
            current_resin,
            max_resin,
            resin_recovery_time,
            finished_task_num,
            total_task_num,
            current_expedition_num,
            max_expedition_num,
            expeditions,
          } = result;
          expeditions.forEach((avatar) => {
            _giexpeditions.push(
              `- (Unknown Character, on maintenance state), Status: ${
                avatar.status === "Finished"
                  ? "Done, not claimed yet"
                  : "Still ongoing"
              }${
                avatar.status == "Finished"
                  ? ""
                  : ` ETA: ${toHoursAndMinutes(avatar.remained_time)}`
              }`
            );
          });
          str =
            "```" +
            `Current Resin: ${current_resin}/${max_resin}${
              resin_recovery_time === "0"
                ? ", Already full"
                : `, ${toHoursAndMinutes(resin_recovery_time)} until full`
            }\nExpedition status (${current_expedition_num}/${max_expedition_num})\n${finished_task_num}/${total_task_num} Daily missions done\nExpeditions/Tasks:\n${_giexpeditions.join(
              "\n"
            )}` +
            "```";
        }
        delay(2000).then(async () => {
          return await message.edit(str);
        });
      }
    });
  },
};

function toHoursAndMinutes(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hour ${minutes} minute ${seconds} second`;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
