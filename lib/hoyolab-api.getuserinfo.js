const { Cookie, HTTPRequest, Language, USER_GAMES_LIST, DEFAULT_REFERER, getHsrRegion, getGenshinRegion, getHi3Region } = require("@rexprjkt/hoyoapi");

exports.hoyoverse = class {
  constructor(options) {
    const cookie = typeof options.cookie === "string" ? Cookie.parseCookieString(options.cookie) : options.cookie;
    this.cookie = cookie;
    if (!options.lang) {
      options.lang = Language.parseLang(cookie.mi18nLang);
    }
    this.gameType = options.gameType;
    this.request = new HTTPRequest(Cookie.parseCookie(this.cookie));
    this.request.setReferer(DEFAULT_REFERER);
    this.request.setLang(options.lang);
    this.uid = options.uid ?? null;
    this.region =
      this.uid !== null && this.gameType == "hsr"
        ? getHsrRegion(this.uid)
        : this.uid !== null && this.gameType == "gi"
        ? getGenshinRegion(uid)
        : this.uid !== null && this.gametype == "hi3"
        ? getHi3Region(uid)
        : null;
    this.lang = options.lang;
  }

  async getUserAccountInfo() {
    return await this.request.send(USER_GAMES_LIST);
  }
};
