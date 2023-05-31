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
