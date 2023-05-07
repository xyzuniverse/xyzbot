const hoyolab = require('../../lib/scraper/hoyolab.js');
let handler = async(messages, { client, text }) => {
    let user = global.db.data.users[messages.author || messages.from]
    if (!user?.hoyolab?.cookieToken) return messages.reply("Cookie token not found! Please generate it from hoyolab website.\nTutorial coming soon.")
    try {
        messages.react("⏳");
        const result = await hoyolab.hsrGetListClaimedRewards(user.hoyolab.cookieToken)
        if (result.data) {
            messages.react("✅");
            messages.reply("Last daily check-in claimed: " + result.data.list[0].name + " x" + result.data.list[0].cnt)
        }
    } catch (e) {
        console.log(e)
        return messages.reply("Contacting hoyolab API failed, please try again later.")
    }
}

handler.command = /^(gidailylastclaim)$/i
module.exports = handler;