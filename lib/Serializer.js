const {
  proto,
  areJidsSameUser,
  jidDecode,
} = require("@whiskeysockets/baileys");

function decodeJid(jid) {
  let obj = jidDecode(jid);
  return (obj.user + "@" + obj.server).toString();
}

const serializeMessage = async (client, msg) => {
  if (!msg) return;

  const loadActualMessage = () => {
    try {
      return Object.keys(msg.message)[0] == "senderKeyDistributionMessage"
        ? Object.keys(msg.message)[2] == "messageContextInfo"
          ? Object.keys(msg.message)[1]
          : Object.keys(msg.message)[2]
        : Object.keys(msg.message)[0] != "messageContextInfo"
        ? Object.keys(msg.message)[0]
        : Object.keys(msg.message)[1];
    } catch {
      return null;
    }
  };

  if (msg.key) {
    msg.id = msg.key.id;
    msg.from = decodeJid(msg.key.remoteJid); // Extract only the user part
    msg.isGroup = msg.key.remoteJid.endsWith("@g.us");
    msg.sender = decodeJid(
      (msg.key.fromMe && client.user.id) ||
        msg.key.participant ||
        msg.key.remoteJid
    );
    msg.isBaileys = msg.key.fromMe;
  }

  if (msg.message) {
    if (msg.message.viewOnceMessage) {
      msg.type = Object.keys(msg.message.viewOnceMessage.message)[0];
      msg.content = msg.message.viewOnceMessage.message[msg.type];
    } else {
      msg.message.viewOnceMessageV2
        ? ((msg.type = Object.keys(msg.message.viewOnceMessageV2.message)[0]),
          (msg.content = msg.message.viewOnceMessageV2.message[msg.type]))
        : ((msg.type = loadActualMessage()),
          (msg.content = msg.message[msg.type]));
    }

    (msg.type === "ephemeralMessage" ||
      msg.type === "documentWithCaptionMessage") &&
      (serializeMessage(client, msg.content),
      (msg.type = msg.content.mtype),
      (msg.content = msg.content.content));

    let q = (msg.quoted =
      typeof msg.content != "undefined"
        ? msg.content.contextInfo
          ? msg.content.contextInfo.quotedMessage
          : null
        : null);
    msg.quoted = client?.store
      ? await serializeMessage(client, (await client.store.loadMessage(
          msg.isGroup ? msg.from : msg.sender,
          msg.content?.contextInfo?.stanzaId
        )))
      : q
      ? await serializeMessage(client, proto.WebMessageInfo.fromObject({
          key: {
            remoteJid: msg.content.contextInfo.remoteJid || msg.from,
            fromMe:
              msg.content.contextInfo.participant ===
              decodeJid(client?.user?.id),
            id: msg.content.contextInfo.stanzaId,
          },
          message: q,
          ...(msg.isGroup
            ? { participant: msg.content.contextInfo.participant }
            : {}),
        }))
      : null; // Generate actual message instead
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

  msg.edit = async (text) => {
    return await client.sendMessage(msg.from, {
      text: text,
      edit: msg.key,
    });
  };

  return msg;
};

module.exports = { serializeMessage, decodeJid };
