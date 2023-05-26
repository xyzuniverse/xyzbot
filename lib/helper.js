var _ = require("lodash");
var { jidDecode } = require("@whiskeysockets/baileys");
var fs = require("fs");
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
   * Size Limitation
   * @param {String} str
   * @param {Integer} max
   */
  sizeLimit(str, max) {
    let data;
    if (str.match("G") || str.match("GB") || str.match("T") || str.match("TB"))
      return (data = {
        oversize: true,
      });
    if (str.match("M") || str.match("MB")) {
      let first = str.replace(/MB|M|G|T/g, "").trim();
      if (isNaN(first))
        return (data = {
          oversize: true,
        });
      if (first > max)
        return (data = {
          oversize: true,
        });
      return (data = {
        oversize: false,
      });
    } else {
      return (data = {
        oversize: false,
      });
    }
  },

  getFileSize(file) {
    var stats = fs.statSync(file);
    var size = stats.size;
    function round(value, precision) {
      var multiplier = Math.pow(10, precision || 0);
      return Math.round(value * multiplier) / multiplier;
    }
    var megaByte = 1024 * 1024;
    var gigaByte = 1024 * megaByte;
    var teraByte = 1024 * gigaByte;
    if (size < 1024) {
      return size + " B";
    } else if (size < megaByte) {
      return round(size / 1024, 1) + " KB";
    } else if (size < gigaByte) {
      return round(size / megaByte, 1) + " MB";
    } else if (size < teraByte) {
      return round(size / gigaByte, 1) + " GB";
    } else {
      return round(size / teraByte, 1) + " TB";
    }
  },
};
