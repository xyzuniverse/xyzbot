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
      let user = global.db.data.users[msg.from || msg.author];
      if (!("hoyolab" in user)) user.hoyolab = {};
      user.hoyolab = {
        cookieToken: result,
      };
      let client = new hoyoverse({
        cookie: result,
      });
      let _userinfo = await client.getUserAccountInfo();
      if (!_userinfo.data) return msg.reply("```" + JSON.stringify(_userinfo) + "```");
      let _game = _userinfo.data.list.filter(
        (v) => v.game_biz == (command.split("getcookie")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL)
      );
      _game.forEach((_user) => {
        user.hoyolab[command.split("getcookie")[0] == "gi" ? GamesEnum.GENSHIN_IMPACT : GamesEnum.HONKAI_STAR_RAIL] = {
          uid: _user.game_uid,
          server: _user.region,
          nickname: _user.nickname,
        };
      });
      await global.db.write();
      msg.reply(
        `Cookie token telah disimpan, silahkan ketik command ${usedPrefix}${
          command.split("getcookie")[0]
        }setserver <server yang dipilih> agar beberapa fitur API hoyoverse lebih akurat.`
      );
    } else return msg.reply("A error occured, maybe cookie token didn't included properly.\nPlease try again.");
  }
};

handler.help = ["gigetcookie <cookietoken>", "hsrgetcookie <cookietoken>"];
handler.tags = ["hyv"];
handler.command = ["gigetcookie", "hsrgetcookie"];
module.exports = handler;
