const { Cookie, GamesEnum } = require("@rexprjkt/hoyoapi");
const { hoyoverse } = require("../../lib/hoyolab-api.getuserinfo");

let handler = async (msg, { text, command, usedPrefix }) => {
  if (!text)
    return msg.reply(
      `Insert the cookie token!\nNOTE: Sekarang cookie token bisa dipisah jika akun anda berbeda tiap platform game,\nCukup isi dengan ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nAtau jika akun anda terkait keseluruh platform game jadi satu akun, cukup ketik ${usedPrefix}hoyoversegetcookie saja.`
    );
  msg.reply("Just a moment...").then(async (message) => {
    let _game =
      command.split("getcookie")[0] == "gi"
        ? GamesEnum.GENSHIN_IMPACT
        : command.split("getcookie")[0] == "hsr"
        ? GamesEnum.HONKAI_STAR_RAIL
        : command.split("getcookie")[0] == "hi3"
        ? GamesEnum.HONKAI_IMPACT
        : null;
    let result;
    try {
      result = Cookie.parseCookieString(text);
    } catch (e) {
      return msg.reply(e.toString());
    } finally {
      if (result) {
        let user = global.db.data.users[msg.from || msg.author];
        if (!("hoyolab" in user)) user.hoyolab = {};
        if (_game) {
          user.hoyolab = {
            cookieToken: {
              [_game]: result,
            },
          };
        } else user.hoyolab.cookieToken = result;
        let client = new hoyoverse({
          cookie: result,
        });
        let _userinfo = await client.getUserAccountInfo();
        if (!_userinfo.response.data) return await message.reply("```" + JSON.stringify(_userinfo) + "```");
        await global.db.write();
        delay(2000).then(async () => {
          if (command.includes("hoyoverse")) {
            return await message.edit(
              `Cookie token telah disimpan, silahkan ketik command ${usedPrefix}gisetserver/${usedPrefix}hi3setserver/${usedPrefix}hsrsetserver <server yang dipilih> agar beberapa fitur API hoyoverse lebih akurat.\nNOTE: Sekarang cookie token bisa dipisah jika akun anda berbeda tiap platform game,\nCukup isi dengan ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nAtau jika akun anda terkait keseluruh platform game jadi satu akun, cukup ketik ${usedPrefix}hoyoversegetcookie saja.`
            );
          } else
            return await message.edit(
              `Cookie token telah disimpan, silahkan ketik command ${usedPrefix}${
                command.split("getcookie")[0]
              }setserver <server yang dipilih> agar beberapa fitur API hoyoverse lebih akurat.\nNOTE: Sekarang cookie token bisa dipisah jika akun anda berbeda tiap platform game,\nCukup isi dengan ${usedPrefix}gigetcookie/${usedPrefix}hi3getcookie/${usedPrefix}hsrgetcookie\nAtau jika akun anda terkait keseluruh platform game jadi satu akun, cukup ketik ${usedPrefix}hoyoversegetcookie saja.`
            );
        });
      } else return msg.reply("A error occured, maybe cookie token didn't included properly.\nPlease try again.");
    }
  });
};

handler.help = ["gigetcookie <cookietoken>", "hsrgetcookie <cookietoken>", "hi3getcookie <cookietoken>", "hoyoversegetcookie <cookietoken>"];
handler.tags = ["hyv"];
handler.command = ["gigetcookie", "hsrgetcookie", "hi3getcookie", "hoyoversegetcookie"];
module.exports = handler;

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
