var _ = require("lodash");
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
};
