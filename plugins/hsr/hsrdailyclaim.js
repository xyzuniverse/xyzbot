const hoyolab = require('../../lib/scraper/hoyolab');
let handler = async(messages, { client, text }) => {
    let user = global.db.data.users[messages.author || messages.from]
    if (!user?.hoyolab?.cookieToken) return messages.reply("Cookie token not found! Please generate it from hoyolab website.\nTutorial coming soon.")
    messages.react("⏳");
    const result = await hoyolab.hsrClaimDailyCheckIn(user.hoyolab.cookieToken);
    const item = await hoyolab.hsrGetListClaimedRewards(user.hoyolab.cookieToken);
    if (result.retcode === -5003) {
        messages.react("⚠️");
        messages.reply(
            result.message + "\n" +
            "Terakhir anda telah mengklaim: " + `${item.data.list[0].name} x${item.data.list[0].cnt}`
        );
    } else if (result.retcode === 0) {
        messages.react("✅");
        messages.reply(
            "Berhasil mengklaim daily check-in, silahkan login ke game untuk melanjutkan.\n" + 
            "Anda mendapatkan: " + `${item.data.list[0].name} x${item.data.list[0].cnt}`
        );
    } else {
        messages.react("⚠️");
        return messages.reply("Contacting hoyolab API failed, please try again later.")
    }
}

handler.command = /^(hsrdailyclaim)$/i
module.exports = handler;