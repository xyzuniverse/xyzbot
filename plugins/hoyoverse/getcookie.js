const { Cookie, GamesEnum } = require("@vermaysha/hoyolab-api");
const { hoyoverse } = require("../../lib/hoyolab-api.getuserinfo");

let handler = async (msg, { text, command, usedPrefix }) => {
  if (!text) return msg.reply("Insert the cookie token!");
  var result;
  try {
    result = Cookie.parseCookieString(text);
  } catch (e) {
    return msg.reply(e.toString());
  } finally {
    if (result) {
      let user = global.db.data.users[msg.author];
      user.hoyolab = {
        cookieToken: result,
      };
      let client = new hoyoverse({
        cookie: result,
      });
      let _userinfo = await client.getUserAccountInfo();
      let _game = _userinfo.data.list.filter(
        (v) => v.game_biz == (command.split("getcookie")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL)
      );
      if (_game.length > 1) {
        msg.reply(
          `Terdapat beberapa server di akun ini, silahkan ketik command ${usedPrefix}${
            command.split("getcookie")[0]
          }setserver <server yang dipilih> agar beberapa fitur API hoyoverse lebih akurat.`
        );
      } else {
        _game.forEach((_user) => {
          user.hoyolab[command.split("getcookie")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL] = {
            uid: _user.game_uid,
            server: _user.region,
            nickname: _user.nickname,
          };
        });
      }
      await global.db.write();
      msg.reply(`Cookie token telah disimpan.`);
    } else return msg.reply("A error occured, maybe cookie token didn't included properly.\nPlease try again.");
  }
};

handler.command = ["gigetcookie", "hsrgetcookie"];
module.exports = handler;
