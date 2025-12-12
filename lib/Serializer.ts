import { proto, jidDecode } from "baileys";
import type { WASocket } from "baileys";

export const decodeJid = (jid: string): string => {
    try {
        let obj = jidDecode(jid);
        return (obj ? obj.user + "@" + obj.server : jid).toString();
    } catch {
        return jid;
    }
};

export const serializeMessage = (client: WASocket, msg: any) => {
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
            (msg.key.fromMe && client.user?.id) || msg.participant || msg.key.participant || msg.key.remoteJid
        );
        msg.isBaileys = /-/.test(msg.id) || msg.id.startsWith("BAE5") || (msg.id.startsWith("3EB0") && msg.key.fromMe);
    }

    if (msg.message) {
        if (msg.message.viewOnceMessage) {
            msg.type = Object.keys(msg.message.viewOnceMessage.message)[0];
            msg.content = msg.message.viewOnceMessage.message[msg.type];
        } else {
            if (msg.message.viewOnceMessageV2) {
                msg.type = Object.keys(msg.message.viewOnceMessageV2.message)[0];
                msg.content = msg.message.viewOnceMessageV2.message[msg.type];
            } else {
                msg.type = loadActualMessage() ? loadActualMessage() : Object.keys(msg.message)[0];
                msg.content = msg.message[msg.type];
            }
        }

        if (["ephemeralMessage", "documentWithCaptionMessage"].includes(msg.type)) {
            serializeMessage(client, msg.content);
            msg.type = msg.content.type;
            msg.content = msg.content.content;
        }

        let q = (msg.quoted =
            typeof msg.content != "undefined"
                ? msg.content.contextInfo
                    ? msg.content.contextInfo.quotedMessage
                    : null
                : null);

        // Quoted message - generate actual message instead
        msg.quoted = q
            ? serializeMessage(
                client,
                proto.WebMessageInfo.fromObject({
                    key: {
                        remoteJid: msg.content.contextInfo?.remoteJid || msg.from,
                        fromMe: msg.content.contextInfo?.participant === decodeJid(client?.user?.id || "") || msg.key?.fromMe,
                        id: msg.content.contextInfo?.stanzaId,
                    },
                    message: q,
                    ...(msg.isGroup ? { participant: msg.content.contextInfo?.participant } : {}),
                })
            )
            : null;
        if (msg.type === "extendedTextMessage") {
            msg.text = msg.content.text;
        } else if (msg.type === "conversation") {
            msg.text = msg.content;
        } else if (msg.type === "imageMessage" || msg.type === "videoMessage") {
            msg.text = msg.content.caption;
        } else msg.text = "";
    }

    msg.react = async (emoji: string) => {
        try {
            await client.sendMessage(msg.from, {
                react: { text: emoji, key: msg.key },
            });
        } catch (error) {
            console.error("React error:", error);
            throw error;
        }
    };

    msg.reply = async (message: any) => {
        try {
            return await client.sendMessage(msg.from, typeof message == "string" ? { text: message } : message, {
                quoted: msg,
            });
        } catch (error) {
            console.error("Reply error:", error);
            throw error;
        }
    };

    msg.edit = async (text: string) => {
        return await client.sendMessage(msg.from, {
            text: text,
            edit: msg.key,
        });
    };

    return msg;
};
