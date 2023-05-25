var serialize = require("./lib/serialize");
module.exports = {
  async chatHandler(messageUpdate) {
    if (!messageUpdate.messages[0]) return;
    let msg = serialize.serializeMessage(messageUpdate?.messages[0]);
    try {
      serialize.serializeMessage(msg);
      console.log(msg);

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
    } catch (e) {
      console.error("HandlerError:", e);
    }
  },
};
