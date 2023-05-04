let syntaxerror = require("syntax-error");
let util = require("util");

let handler = async (messages, _2) => {
  let { client, usedPrefix, noPrefix, args, groupMetadata } = _2;
  let _return;
  let _syntax = "";
  let _text = (/^=/.test(usedPrefix) ? "return " : "") + noPrefix;
  let old = messages.exp * 1;
  try {
    let i = 15;
    let f = {
      exports: {},
    };
    let exec = new (async () => {}).constructor(
      "print",
      "messages",
      "handler",
      "require",
      "client",
      "Array",
      "process",
      "args",
      "groupMetadata",
      "module",
      "exports",
      "argument",
      _text
    );
    _return = await exec.call(
      client,
      (...args) => {
        if (--i < 1) return;
        console.log(...args);
        return messages.reply(util.format(...args));
      },
      messages,
      handler,
      require,
      client,
      CustomArray,
      process,
      args,
      groupMetadata,
      f,
      f.exports,
      [client, _2]
    );
  } catch (e) {
    let err = await syntaxerror(_text, "Execution Function", {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    });
    if (err) _syntax = "```" + err + "```\n\n";
    _return = e;
  } finally {
    messages.reply(_syntax + util.format(_return));
    messages.exp = old;
  }
};
handler.help = ["> ", "=> "];
handler.tags = ["advanced"];
handler.customPrefix = /^=?> /;
handler.command = /(?:)/i;
handler.rowner = true;
handler.owner = false;
handler.mods = false;
handler.premium = false;
handler.group = false;
handler.private = false;

handler.admin = false;
handler.botAdmin = false;

handler.fail = null;

module.exports = handler;

class CustomArray extends Array {
  constructor(...args) {
    if (typeof args[0] == "number") return super(Math.min(args[0], 10000));
    else return super(...args);
  }
}
