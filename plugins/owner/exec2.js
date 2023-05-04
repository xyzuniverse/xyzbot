let cp = require("child_process");
let { promisify } = require("util");
let exec = promisify(cp.exec).bind(cp);
let handler = async (m, { client, isOwner, command, text }) => {
  if (global.client.user.jid != client.user.jid) return;
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
