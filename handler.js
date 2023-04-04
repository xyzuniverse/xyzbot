var config = require("./config");
module.exports = {
  async handler(msgEvent) {
    // The message handler
    let m = require("./lib/messageHelper").messageHelper(
      conn,
      msgEvent?.messages[0]
    );
    try {
      // Database
      require("./lib/database")(m);

      // Plugin midman (prevent users to running the plugins)
      let isROwner = [this.user.jid, ...config.owner.map(([number]) => number)]
        .map((v) => v?.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
        .includes(m.sender);
      let isOwner = isROwner || m.fromMe;
      if (m.isBaileys) return; // Prevent bot to loop re-sent messages if prefix triggered by the bot

      // Plugin manager, and executor
      let usedPrefix;
      for (let name in global.plugins) {
        let plugin = global.plugins[name];
        if (!plugin) continue;
        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        let _prefix = plugin.customPrefix
          ? plugin.customPrefix
          : conn.prefix
          ? conn.prefix
          : global.prefix;
        let match = (
          _prefix instanceof RegExp // RegExp Mode?
            ? [[_prefix.exec(m.text), _prefix]]
            : Array.isArray(_prefix) // Array?
            ? _prefix.map((p) => {
                let re =
                  p instanceof RegExp // RegExp in Array?
                    ? p
                    : new RegExp(str2Regex(p));
                return [re.exec(m.text), re];
              })
            : typeof _prefix === "string" // String?
            ? [
                [
                  new RegExp(str2Regex(_prefix)).exec(m.text),
                  new RegExp(str2Regex(_prefix)),
                ],
              ]
            : [[[], new RegExp()]]
        ).find((p) => p[1]);
        if ((usedPrefix = (match[0] || "")[0])) {
          let noPrefix = m.text.replace(usedPrefix, "");
          let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
          args = args || [];
          let _args = noPrefix.trim().split` `.slice(1);
          let text = _args.join` `;
          command = (command || "").toLowerCase();
          let fail = plugin.fail || global.dfail;
          let isAccept =
            plugin.command instanceof RegExp // RegExp Mode?
              ? plugin.command.test(command)
              : Array.isArray(plugin.command) // Array?
              ? plugin.command.some((cmd) =>
                  cmd instanceof RegExp // RegExp in Array?
                    ? cmd.test(command)
                    : cmd === command
                )
              : typeof plugin.command === "string" // String?
              ? plugin.command === command
              : false;

          if (!isAccept) continue;
          m.plugin = name;

          // Throw the message if didn't meet the required roles.
          if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
            // Both Owner
            fail("owner", m, this);
            continue;
          }
          if (plugin.rowner && !isROwner) {
            // Real Owner
            fail("rowner", m, this);
            continue;
          }
          if (plugin.owner && !isOwner) {
            // Number Owner
            fail("owner", m, this);
            continue;
          }

          m.isCommand = true;
          let extra = {
            match,
            usedPrefix,
            noPrefix,
            _args,
            args,
            command,
            text,
            conn: this,
            isROwner,
            isOwner,
          };
          try {
            await plugin.call(this, m, extra);
          } catch (e) {
            console.log(e);
          }
        }
      }
    } finally {
      // Simplified printed chat
      require("./lib/print")(this, m).catch((e) => console.log(e));
    }
  },
};
global.dfail = async (type, m) => {
  let msg = {
    rowner: "Sorry, this command can only executed by the real owner.",
    owner: "Sorry, this command can only executed by the owners.",
  }[type];
  if (msg) return conn.reply(m.chat, msg, m);
};
