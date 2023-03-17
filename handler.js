module.exports = {
    async handler(msgEvent) {
        let m = msgEvent?.messages[0]

        // The message handler
        try {
            console.log(JSON.stringify(m, null, 2))
            let serialized = require('./socketHelper').messageHelper(conn, m)
            console.log(serialized)
        } catch (e) {
            console.log(e)
        }
    }
}