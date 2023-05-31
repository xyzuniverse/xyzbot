var _ = require("lodash");
var { jidDecode } = require("@whiskeysockets/baileys");
var fs = require("fs");
var axios = require("axios");
var FormData = require("form-data");
var { fromBuffer } = require("file-type");

module.exports = {
  /**
   * Get message from stored chats
   * @param {*} key
   * @param {*} store
   * @returns
   */
  async getMessage(key, store) {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid, key.id);
      return msg?.message || undefined;
    }
    return {
      conversation: "Hello there!",
    };
  },

  /**
   * Load database
   * @param {*} db
   */
  async loadDatabase(db) {
    await db.read();
    db.data = {
      users: {},
      chats: {},
      stats: {},
      msgs: {},
      sticker: {},
      settings: {},
      ...(db.data || {}),
    };
    db.chain = _.chain(db.data);
  },

  /**
   * Serialize jid
   * @param {*} jid
   * @returns
   */
  serializeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  },

  /**
   * Upload image to telegra.ph
   * Supported mimetype:
   * - `image/jpeg`
   * - `image/jpg`
   * - `image/png`s
   * @param {Buffer} buffer Image Buffer
   */
  async uploadImage(buffer) {
    const { ext } = await fromBuffer(buffer);
    let form = new FormData();
    form.append("file", buffer, "tmp." + ext);

    try {
      let response = await axios.post("https://telegra.ph/upload", form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      let img = response.data;
      if (img.error) throw img.error;

      return "https://telegra.ph" + img[0].src;
    } catch (error) {
      throw new Error(`Error uploading image: ${error.message}`);
    }
  },
};
