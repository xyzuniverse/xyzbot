const hoyolab = require('../../lib/scraper/hoyolab');
let handler = async(msg, { client, text }) => {
    let user = global.db.data.users[msg.author || msg.from]
    if (!user?.hoyolab?.cookieToken) return msg.reply("Cookie token not found! Please generate it from hoyolab website.\nTutorial coming soon.")
    msg.react("⏳");
    const result = await hoyolab.claimDailyCheckIn('genshin', user.hoyolab.cookieToken);
    const item = await hoyolab.getListClaimedRewards('genshin', user.hoyolab.cookieToken);
    if (result.retcode === -5003) {
        msg.react("⚠️");
        msg.reply(
            result.message + "\n" +
            "Terakhir anda telah mengklaim: " + `${item.data.list[0].name} x${item.data.list[0].cnt}`
        );
    } else if (result.retcode === 0) {
        msg.react("✅");
        msg.reply(
            "Berhasil mengklaim daily check-in, silahkan login ke game untuk melanjutkan.\n" + 
            "Anda mendapatkan: " + `${item.data.list[0].name} x${item.data.list[0].cnt}`
        );
    } else {
        msg.react("⚠️");
        return msg.reply("Contacting hoyolab API failed, please try again later.")
    }
}

handler.help = ['gidailyclaim']
handler.tags = ['genshin']
handler.command = /^(gidailyclaim)$/i
module.exports = handler;