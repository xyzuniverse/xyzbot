const hoyolab = require('../../lib/scraper/hoyolab.js');
let handler = async(msg, { client, text }) => {
    let user = global.db.data.users[msg.author || msg.from]
    if (!user?.hoyolab?.cookieToken) return msg.reply("Cookie token not found! Please generate it from hoyolab website.\nTutorial coming soon.")
    try {
        msg.react("⏳");
        const result = await hoyolab.getListClaimedRewards('hsr', user.hoyolab.cookieToken)
        if (result.data) {
            msg.react("✅");
            msg.reply("Last daily check-in claimed: " + result.data.list[0].name + " x" + result.data.list[0].cnt)
        }
    } catch (e) {
        console.log(e)
        return msg.reply("Contacting hoyolab API failed, please try again later.")
    }
}

handler.help = ['hsrdailylastclaim']
handler.tags = ['hsr']
handler.command = /^(hsrdailylastclaim)$/i
module.exports = handler;