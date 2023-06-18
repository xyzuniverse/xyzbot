const { Genshin, HonkaiStarRail: _HSR, GamesEnum } = require("@vermaysha/hoyolab-api");
const { HonkaiStarRail } = require("../../lib/hoyolab-api.getuserinfo");
const StarRail = HonkaiStarRail(_HSR);

let handler = async (msg, { command }) => {
  let user = global.db.data.users[msg.author];
  if (!user?.hoyolab?.cookieToken)
    return msg.reply("Cookie token tidak ditemukan! Silahan generate cookie token di hoyolab website.\nTutorial coming soon.");
  var result;
  try {
    let _game = command.split("dailynote")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL;
    let options = { cookie: user.hoyolab.cookieToken, lang: "id-id", uid: user.hoyolab[_game].uid };
    let game = command.split("dailynote")[0] == "gi" ? new Genshin(options) : new StarRail(options);
    result = await game.dailyNote();
  } catch (e) {
    console.error(e);
    msg.reply(e);
    msg.reply("A error occured, please try again later.");
  } finally {
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
      msg.reply(
        "```" +
          `Current Trailblazer Power: ${current_stamina}/${max_stamina}${
            stamina_recover_time === "0" ? ", Sudah penuh" : `, ${toHoursAndMinutes(stamina_recover_time)} lagi untuk penuh`
          }\nPelaksanaan Tugas (${accepted_epedition_num}/${total_expedition_num})\nExpeditions/Tugas:\n${_expeditions.join("\n")}` +
          "```"
      );
    } else {
      let _giexpeditions = [];
      let {
        current_resin,
        max_resin,
        resin_recovery_time,
        finished_task_num,
        total_task_num,
        expeditions,
        current_expedition_num,
        max_expedition_num,
      } = result;
      expeditions.forEach((avatar) => {
        _giexpeditions.push(
          `- ${avatar.avatar_side_icon.split("Side_")[1].split(".png")[0]}, Status: ${
            avatar.status === "Finished" ? "Selesai, belum diclaim" : "Masih berjalan"
          }${avatar.status == "Finished" ? "" : ` ETA: ${toHoursAndMinutes(avatar.remained_time)}`}`
        );
      });
      msg.reply(
        "```" +
          `Current Resin: ${current_resin}/${max_resin}${
            resin_recovery_time === "0" ? ", Sudah penuh" : `, ${toHoursAndMinutes(resin_recovery_time)} lagi untuk penuh`
          }\nEkspedisi status (${current_expedition_num}/${max_expedition_num})\n${finished_task_num}/${total_task_num} Misi harian diselesaikan\nEkspedisi/Tugas:\n${_giexpeditions.join(
            "\n"
          )}` +
          "```"
      );
    }
  }
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
