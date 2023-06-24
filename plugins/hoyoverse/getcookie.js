const { Cookie, GamesEnum } = require("@vermaysha/hoyolab-api");
const { hoyoverse } = require("../../lib/hoyolab-api.getuserinfo");

let handler = async (msg, { text, command, usedPrefix }) => {
  if (!text) return msg.reply("Insert the cookie token!");
  msg.reply("Just a moment...").then(async (message) => {
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
        if (!_userinfo.data) return await message.edit("```" + JSON.stringify(_userinfo) + "```");
        await global.db.write();
        await message.edit(
          `Cookie token telah disimpan, silahkan ketik command ${usedPrefix}${
            command.split("getcookie")[0]
          }setserver <server yang dipilih> agar beberapa fitur API hoyoverse lebih akurat.`
        );
      } else return msg.reply("A error occured, maybe cookie token didn't included properly.\nPlease try again.");
    }
  })
};

handler.help = ["gigetcookie <cookietoken>", "hsrgetcookie <cookietoken>"];
handler.tags = ["hyv"];
handler.command = ["gigetcookie", "hsrgetcookie"];
module.exports = handler;
