let cp = require("child_process");
let { promisify } = require("util");
let exec = promisify(cp.exec).bind(cp);
let handler = async (msg, { client, isOwner, command, text }) => {
  if (global.client.info.wid.user != client.info.wid.user) return;
  msg.reply("Executing...").then(async (message) => {
    let o;
    try {
      o = await exec(command.trimStart() + " " + text.trimEnd());
    } catch (e) {
      o = e;
    } finally {
      let { stdout, stderr } = o;
      delay(2000).then(async () => {
        if (stdout.trim()) await message.edit(stdout);
        if (stderr.trim()) await message.edit(stderr);
      });
    }
  });
};
handler.customPrefix = /^[$] /;
handler.command = new RegExp();
handler.rowner = true;
module.exports = handler;

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
