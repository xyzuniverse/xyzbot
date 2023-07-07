const { getContentType, extractMessageContent, proto } = require("@whiskeysockets/baileys");
exports.serializeMessage = (client, msg) => {
  if (!msg) return msg;
  msg = proto.WebMessageInfo.fromObject(msg);
  if (msg.key) {
    msg.id = msg.key?.id;
    msg.from = msg?.key?.remoteJid;
    msg.isGroup = msg.from.endsWith("g.us");
    msg.author = msg.isGroup ? msg.key?.participant : msg.from;
    msg.fromMe = msg.key?.fromMe;
    msg.isBaileys = msg.key.id.startsWith("BAE5");
  }
  if (msg.message) {
    let mtype = Object.keys(msg.message)
    msg.type = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype[0]) && mtype[0]) || // Sometimes message in the front
        (mtype.length >= 3 && mtype[1] !== 'messageContextInfo' && mtype[1]) || // Sometimes message in midle if mtype length is greater than or equal to 3!
         mtype[mtype.length - 1] // common case
    msg.content = msg.message[msg.type]
    msg.text = msg.content?.text || msg.content?.caption || msg.content?.contentText || msg.content || ''
    if (typeof msg.text !== 'string') {
      if ([
        'protocolMessage',
        'messageContextInfo',
        'stickerMessage',
        'audioMessage',
        'senderKeyDistributionMessage'
      ].includes(msg.type)) msg.text = ''
      else msg.text = msg.text.selectedDisplayText || msg.text.hydratedTemplate?.hydratedContentText || msg.text
    }
  }
  if (msg.content && typeof msg.content == "object") {
    msg.hasQuotedMessage = JSON.stringify(msg.content).includes("quotedMessage");
    if (msg.hasQuotedMessage) {
      msg.getQuotedMessage = async () => {
        q = proto.WebMessageInfo.fromObject({
          key: {
            fromMe: msg.content.contextInfo.quotedMessage.fromMe,
            id: msg.content.contextInfo.stanzaId,
            remoteJid: msg.content.contextInfo.remoteJid || msg.from,
          },
          message: msg.content.contextInfo?.quotedMessage,
          ...(msg.isGroup ? { participants: msg.content.contextInfo?.participant } : {}),
        });
        return exports.serializeMessage(client, q);
      };
    }
    msg.hasMedia = ["image", "video"].includes(msg.type.replace(/message$/i, ""));
    msg.mentionedJid = msg.content.contextInfo ? msg.content.contextInfo.mentionedJid : [];
    msg.body = ("text" in msg.content && msg.content.text) || ("caption" in msg.content && msg.content.caption) || "";
  } else if (typeof msg.content === "string") {
    msg.body = msg.content;
  }

  // Functions

  /**
   * Reply to a message
   * @param {*} message
   * @returns
   */
  msg.reply = function (message) {
    return client.sendMessage(msg.from, typeof message == "string" ? { text: message } : message, { quoted: msg });
  };

  /**
   * React to a message
   * @param {*} emoji
   * @returns
   */
  msg.react = function (emoji) {
    return client.sendMessage(msg.from, { react: { text: emoji, key: msg.key } });
  };

  /**
   * Delete message
   * @param {*} key
   * @returns
   */
  msg.deleteMessage = function (key) {
    return client.sendMessage(msg.from, { delete: key });
  };
  
  try {
        if (msg.content && msg.type == 'protocolMessage') client.ev.emit('message.delete', msg.content.key)
    } catch (e) {
        console.error(e)
    }

  return msg;
};
