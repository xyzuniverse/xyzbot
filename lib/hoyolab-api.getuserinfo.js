const { Cookie, Request, parseLang, Route } = require("@vermaysha/hoyolab-api");

exports.hoyoverse = class {
  constructor(options) {
    const cookie = typeof options.cookie === "string" ? Cookie.parseCookieString(options.cookie) : options.cookie;
    this.cookie = cookie;
    if (!options.lang) {
      options.lang = parseLang(cookie.mi18nLang);
    }
    this.request = new Request(Cookie.parseCookie(this.cookie));
    this.request.setReferer(Route.GENSHIN_GAME_RECORD_REFERER);
    this.request.setLang(options.lang);
    this.uid = options.uid ?? null;
    this.region = this.uid !== null ? getServerRegion(this.uid) : null;
    this.lang = options.lang;
  }

  async getUserAccountInfo() {
    return await this.request.send(Route.GAMES_ACCOUNT);
  }
};

exports.HonkaiStarRail = (_HonkaiStarRail) => {
  class HonkaiStarRail extends _HonkaiStarRail {
    constructor(...args) {
      super(...args);
    }

    async records() {
      this.request
        .setParams({
          server: this.region.replace("os", "prod_official"),
          role_id: this.uid,
        })
        .setDs(true);
      const res = (await this.request.send("https://bbs-api-os.hoyolab.com/game_record/hkrpg/api/index")).data.stats;
      return res;
    }

    async dailyNote() {
      if (!this.region || !this.uid) {
        throw new HoyolabError("UID parameter is missing or failed to be filled");
      }
      this.request
        .setParams({
          server: this.region.replace("os", "prod_official"),
          role_id: this.uid,
        })
        .setDs();
      const res = (await this.request.send("https://bbs-api-os.hoyolab.com/game_record/hkrpg/api/note")).data;
      return res;
    }
  }

  return HonkaiStarRail;
};
