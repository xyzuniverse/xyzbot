let cp = require("child_process");
let { promisify } = require("util");
let exec = promisify(cp.exec).bind(cp);
let handler = async (messages, { client, isOwner, command, text }) => {
  if (global.client.info.wid.user != client.info.wid.user) return;
  messages.reply("Executing...");
  let o;
  try {
    o = await exec(command.trimStart() + " " + text.trimEnd());
  } catch (e) {
    o = e;
  } finally {
    let { stdout, stderr } = o;
    if (stdout.trim()) messages.reply(stdout);
    if (stderr.trim()) messages.reply(stderr);
  }
};
handler.customPrefix = /^[$] /;
handler.command = new RegExp();
handler.rowner = true;
module.exports = handler;
