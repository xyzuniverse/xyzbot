const { GenshinImpact, HonkaiStarRail, GamesEnum } = require("@rexprjkt/hoyoapi");

let handler = async (msg, { command }) => {
  let user = global.db.data.users[msg.author || msg.from];
  var result;
  var str;
  msg.reply("Just a moment...").then(async (message) => {
    try {
      let _game = command.split("dailynote")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
      let cookieToken = user.hoyolab?.cookieToken[_game] ? user.hoyolab.cookieToken[_game] : user.hoyolab.cookieToken;
      if (!cookieToken) return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
      let options = { cookie: user.hoyolab.cookieToken, lang: "id-id", uid: user.hoyolab[_game].uid };
      let game = command.split("dailynote")[0] == "gi" ? new GenshinImpact(options) : new HonkaiStarRail(options);
      result = command.split("dailynote")[0] == "gi" ? await game.record.dailyNote() : await game.record.note();
      console.log(result);
    } catch (e) {
      console.error(e);
      msg.reply(e);
      msg.reply("A error occured, please try again later.");
    } finally {
      if (result) message.edit("Done! Getting data...");
      if (command.startsWith("hsr")) {
        let _expeditions = [];
        let { current_stamina, max_stamina, stamina_recover_time, accepted_epedition_num, total_expedition_num, expeditions } = result;
        expeditions.forEach((avatar) => {
          _expeditions.push(
            `- ${avatar.name}, Status: ${avatar.status === "Finished" ? "Selesai, belum diclaim" : "Masih berjalan"}${
              avatar.status === "Finished" ? "" : `, ETA: ${toHoursAndMinutes(avatar.remaining_time)}`
            }`
          );
        });
        str =
          "```" +
          `Current Trailblazer Power: ${current_stamina}/${max_stamina}${
            stamina_recover_time === "0" ? ", Sudah penuh" : `, ${toHoursAndMinutes(stamina_recover_time)} lagi untuk penuh`
          }\nPelaksanaan Tugas (${accepted_epedition_num}/${total_expedition_num})\nExpeditions/Tugas:\n${_expeditions.join("\n")}` +
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
            `- (Unknown Character, on maintenance state), Status: ${avatar.status === "Finished" ? "Selesai, belum diclaim" : "Masih berjalan"}${
              avatar.status == "Finished" ? "" : ` ETA: ${toHoursAndMinutes(avatar.remained_time)}`
            }`
          );
        });
        str =
          "```" +
          `Current Resin: ${current_resin}/${max_resin}${
            resin_recovery_time === "0" ? ", Sudah penuh" : `, ${toHoursAndMinutes(resin_recovery_time)} lagi untuk penuh`
          }\nEkspedisi status (${current_expedition_num}/${max_expedition_num})\n${finished_task_num}/${total_task_num} Misi harian diselesaikan\nEkspedisi/Tugas:\n${_giexpeditions.join(
            "\n"
          )}` +
          "```";
      }
      delay(2000).then(async () => {
        return await message.edit(str);
      });
    }
  });
};

handler.help = ["hsrdailynote", "gidailynote"];
handler.tags = ["hyv"];
handler.command = ["hsrdailynote", "gidailynote"];
module.exports = handler;

function toHoursAndMinutes(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
