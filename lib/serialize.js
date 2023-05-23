const { getContentType, extractMessageContent, proto, areJidsSameUser } = require("@whiskeysockets/baileys");
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
    msg.type = getContentType(msg.message) || Object.keys(msg.message)[0];
    msg.content = extractMessageContent(msg.message)[msg.type] || msg.message[msg.type];
  }
  if (msg.content && typeof msg.content == "object") {
    msg.hasQuotedMessage = JSON.stringify(msg.content).includes("quotedMessage");
    if (msg.hasQuotedMessage) {
      msg.getQuotedMessage = function () {
        var qmsg = proto.WebMessageInfo.fromObject({
          key: {
            id: msg.content.contextInfo.stanzaId,
            remoteJid: msg.from,
            fromMe: areJidsSameUser(msg.content.contextInfo.participant, msg.author)
          },
          message: msg.content.contextInfo.quotedMessage,
          ...(msg.isGroup ? { participant: msg.content.contextInfo.participant } : {})
        })
        return exports.serializeMessage(qmsg);
      }
    }
    msg.body = ("text" in msg.content && msg.content.text) || ("caption" in msg.content && msg.content.caption);
  } else if (typeof msg.content === "string") {
    msg.body = msg.content;
  }
  return msg;
};
