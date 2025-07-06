const isNumber = (x) => typeof x === "number" && !isNaN(x);
module.exports = (msg, bot) => {
  let { data: database } = bot.db;

  // Users
  let user = database.users[msg.sender];
  if (typeof user !== "object") database.users[msg.sender] = {};
  if (user) {
    if (!("name" in user)) user.name = msg.pushName;
    if (!isNumber(user.afk)) user.afk = -1;
    if (!("afkReason" in user)) user.afkReason = "";
  } else
    database.users[msg.sender] = {
      name: msg.pushName,
      afk: -1,
      afkReason: "",
    };

  // Group
  if (msg.isGroup) {
    let group = database.groups[msg.from];
    if (typeof group !== "object") database.groups[msg.from] = [];
    if (group) {
      if (!("activeMembers" in group)) group.activeMembers = [];
    } else
      database.groups[msg.from] = {
        activeMembers: [],
      };

    // TODO: Add active members temporary, cleanup group feature coming soon
    if (
      typeof database.groups[msg.from].activeMembers === "object" &&
      !database.groups[msg.from].activeMembers.includes(msg.sender)
    ) {
      database.groups[msg.from].activeMembers.push(msg.sender);
    }
  }
};
