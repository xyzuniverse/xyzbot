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
    msg.type = getContentType(msg.message) || Object.keys(msg.message)[0];
    msg.content = extractMessageContent(msg.message)[msg.type] || msg.message[msg.type];
    if (["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2"].includes(msg.type)) {
      msg.type = getContentType(msg.content.message);
      msg.content = extractMessageContent(msg.content.message)[msg.type];
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

  /**
   * Sent a template message
   * @param {*} jid
   * @param {*} buttons
   * @param {*} text
   * @param {*} footer
   * @returns
   */
  msg.sendTemplate = async function (jid, buttons = [], text, footer, options = {}) {
    if (typeof buttons !== "object") throw new Error("Buttons must array-typed!");
    else
      return await client.sendMessage(
        jid,
        {
          text: text,
          footer: footer,
          templateButtons: buttons,
        },
        ...options
      );
  };

  return msg;
};