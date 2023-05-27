const { serializeJid } = require("./lib/helper");
var serialize = require("./lib/serialize");
require("./config.js");
module.exports = {
  async chatHandler(messageUpdate) {
    if (!messageUpdate.messages[0]) return;
    let msg = serialize.serializeMessage(this, messageUpdate?.messages[0]);
    try {
      // Database
      try {
        let user = global.db.data.users[msg.author];
        if (typeof user !== "object") global.db.data.users[msg.author] = {};
        if (user) {
          if (!("name" in user)) user.name = msg.pushName;
        } else
          global.db.data.users[msg.author] = {
            name: msg.pushName,
          };
      } catch (e) {
        console.error("DatabaseError:", e);
      }

      // Plugin midman (prevent users to running the plugins)
      let isROwner = [this.user.id.split("@")[0], ...global.owner.map(([number]) => number)]
        .map((v) => v?.replace(/[^0-9]/g, ""))
        .includes((msg.isGroup ? msg.author : msg.from).split("@")[0]);
      let isOwner = isROwner || msg.key.fromMe;

      let groupMetadata = msg.isGroup ? await client.groupMetadata(msg.from) : {};
      let participants = msg.isGroup ? groupMetadata.participants : [];

      let user = msg.isGroup ? participants.find((u) => u.id == msg.author) : {};
      let bot = msg.isGroup ? participants.find((u) => u.id == serializeJid(this.user.id)) : {};

      let isAdmin = msg.isGroup ? user?.admin == "admin" || user?.admin == "superdmin" : false;
      let isBotAdmin = msg.isGroup ? bot?.admin : false;
      if (msg.isBaileys) return;

      // Plugin manager, and executor
      let usedPrefix;
      for (let name in global.plugins) {
        let plugin = global.plugins[name];
        if (!plugin) continue;
        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        let _prefix = plugin.customPrefix ? plugin.customPrefix : client.prefix ? client.prefix : global.prefix;
        let match = (
          _prefix instanceof RegExp // RegExp Mode?
            ? [[_prefix.exec(msg.body), _prefix]]
            : Array.isArray(_prefix) // Array?
            ? _prefix.map((p) => {
                let re =
                  p instanceof RegExp // RegExp in Array?
                    ? p
                    : new RegExp(str2Regex(p));
                return [re.exec(msg.body), re];
              })
            : typeof _prefix === "string" // String?
            ? [[new RegExp(str2Regex(_prefix)).exec(msg.body), new RegExp(str2Regex(_prefix))]]
            : [[[], new RegExp()]]
        ).find((p) => p[1]);
        if ((usedPrefix = (match[0] || "")[0])) {
          let noPrefix = msg.body.replace(usedPrefix, "");
          let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
          args = args || [];
          let _args = noPrefix.trim().split` `.slice(1);
          let text = _args.join` `;
          command = (command || "").toLowerCase();
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
          msg.plugin = name;

          // Throw the message if didn't meet the required roles.
          if (plugin.rowner && !isROwner) {
            msg.reply("This command can only executed by the real owner!");
            continue;
          }
          if (plugin.owner && !isOwner) {
            msg.reply("This command can only executed by the owner.");
            continue;
          }
          if (plugin.admin && !isAdmin) {
            msg.reply("This command can only executed by the administrators.");
            continue;
          }
          if (plugin.botAdmin && !isBotAdmin) {
            msg.reply("Make sure bot is admin before executing this command!");
            continue;
          }
          if (plugin.private && msg.isGroup) {
            msg.reply("This commnd can only executed on private chat.");
            continue;
          }
          if (plugin.group && !msg.isGroup) {
            msg.reply("This command can only executed on group chat.");
            continue;
          }

          msg.isCommand = true;
          let extra = {
            match,
            usedPrefix,
            noPrefix,
            _args,
            args,
            command,
            text,
            client: this,
            msg,
            isAdmin,
            isBotAdmin,
            participants,
          };
          try {
            await plugin.call(this, msg, extra);
          } catch (e) {
            console.log(e);
          }
        }
      }
    } catch (e) {
      console.error("HandlerError:", e);
    } finally {
      require("./lib/print")(client, msg);
    }
  },
};
