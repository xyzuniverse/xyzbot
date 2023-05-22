const { getContentType, extractMessageContent, proto } = require("@whiskeysockets/baileys");
var ephemeralMsgTypes = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2"];
exports.serializeMessage = (msg) => {
  if (!msg) return msg;
  msg = proto.WebMessageInfo.fromObject(msg);
  if (msg.key) {
    msg.id = msg.key?.id;
    msg.from = msg?.key?.remoteJid;
    msg.isGroup = msg.from.endsWith("g.us");
    msg.author = msg.isGroup ? msg.key?.participant : msg.from;
  }
  if (msg.message) {
    msg.type = getContentType(msg.message);
    msg.content = extractMessageContent(msg.message)[msg.type];
  }
  if (msg.content && typeof msg.content == "object") {
    msg.hasQuotedMessage = JSON.stringify(msg.content).includes("quotedMessage");
    if (msg.hasQuotedMessage) {
      msg.quoted = msg.content?.contextInfo?.quotedMessage || {};
      msg.quoted.type = getContentType(msg.quoted);
      msg.quoted.content = extractMessageContent(msg.quoted)[msg.quoted.type];
      msg.quoted.from = msg.content.contextInfo.participant;
      msg.quoted.id = msg.content.contextInfo.stanzaId;
      if (typeof msg.quoted.content == "object") {
        msg.quoted.body =
          ("text" in msg.quoted.content && msg.content.quoted.text) || ("caption" in msg.quoted.content && msg.quoted.content.caption);
      }
      if (typeof msg.quoted.content == "string") {
        msg.quoted.body = msg.quoted.content;
      }
    }
    msg.body = ("text" in msg.content && msg.content.text) || ("caption" in msg.content && msg.content.caption);
  } else if (typeof msg.content === "string") {
    msg.body = msg.content;
  }

  // Replace the messages if includes the ephemeral messages list
  ephemeralMsgTypes.forEach((type) => {
    if (msg.message[type]) {
      msg.type = type;
      msg.content = msg.message[type].message;
    }
    if (msg.hasQuotedMessage && msg.quoted[type]) {
      msg.quoted.type = type;
      msg.quoted.content = msg.quoted[type].message;
    }
  });
  return msg;
};
