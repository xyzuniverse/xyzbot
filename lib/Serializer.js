const {
  proto,
  areJidsSameUser,
  extractMessageContent,
  getContentType,
  jidDecode,
} = require("@whiskeysockets/baileys");

function decodeJid(jid) {
  let obj = jidDecode(jid);
  return (obj.user + "@" + obj.server).toString();
}

const serializeMessage = (client, msg) => {
  if (!msg) return;

  if (msg.key) {
    msg.id = msg.key.id;
    msg.from = decodeJid(msg.key.remoteJid); // Extract only the user part
    msg.isGroup = msg.key.remoteJid.endsWith("@g.us");
    msg.sender = decodeJid(
      msg.key.fromMe ? client.user.id : msg.key.participant || msg.key.remoteJid
    );
    msg.isBaileys = msg.key.fromMe;
  }

  if (msg.message) {
    msg.type = getContentType(msg.message);

    // Handle ephemeral messages *before* extracting content
    if (msg.type === "ephemeralMessage" || msg.type === "viewOnceMessageV2") {
      const actualMessage = msg.message.ephemeralMessage.message;
      msg.type = getContentType(actualMessage); // Get the type of the actual message
      msg.content = extractMessageContent(actualMessage)[msg.type]; // Extract content
    } else {
      msg.content = extractMessageContent(msg.message)[msg.type];
    }

    if (msg.content.contextInfo) {
      msg.mentionedJid = msg.content.contextInfo.mentionedJid;
      if (msg.content.contextInfo.quotedMessage) {
        try {
          // Prototype messageInfo
          let quoted = proto.WebMessageInfo.fromObject({
            key: {
              fromMe: areJidsSameUser(
                msg.content.contextInfo.participant === client.user.id
              ),
              id: msg.content.contextInfo.stanzaId,
              remoteJid: msg.isGroup ? msg.from : msg.sender,
            },
            message: msg.content.contextInfo.quotedMessage.ephemeralMessage
              ? msg.content.contextInfo.quotedMessage.ephemeralMessage.message
              : msg.content.contextInfo.quotedMessage.viewOnceMessageV2
              ? msg.content.contextInfo.quotedMessage.viewOnceMessageV2.message
              : msg.content.contextInfo.quotedMessage,
            ...(msg.isGroup
              ? { participants: msg.content.contextInfo.participant }
              : {}),
          });
          msg.quoted = serializeMessage(client, quoted); // Returns exact serialized message
          if (msg.quoted.key) {
            msg.quoted.sender = decodeJid(
              msg.quoted.key.fromMe
                ? client.user.id
                : msg.quoted.key.participant || msg.quoted.key.remoteJid
            );
          }
        } catch (error) {
          console.error("Error processing quoted message:", error);
          msg.quoted = null;
        }
      }
    }

    if (msg.type === "extendedTextMessage") {
      msg.text = msg.content.text;
    } else if (msg.type === "conversation") {
      msg.text = msg.content;
    } else if (msg.type === "imageMessage" || msg.type === "videoMessage") {
      msg.text = msg.content.caption;
    } else msg.text = "";
  }

  msg.react = async (emoji) => {
    try {
      await client.sendMessage(msg.from, {
        react: { text: emoji, key: msg.key },
      });
    } catch (error) {
      console.error("React error:", error);
      throw error;
    }
  };

  msg.reply = async (message) => {
    try {
      return await client.sendMessage(
        msg.from,
        typeof message == "string" ? { text: message } : message,
        { quoted: msg }
      );
    } catch (error) {
      console.error("Reply error:", error);
      throw error;
    }
  };

  return msg;
};

module.exports = { serializeMessage, decodeJid };
