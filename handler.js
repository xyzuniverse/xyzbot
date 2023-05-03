module.exports = {
    async handler(client, messages) {
        if (!messages) return;
        if (messages.body.startsWith("!eval")) {
            try {
                evaled = await eval(messages.body.slice(6))
                if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
                messages.reply(evaled.toString())
            } catch (e) {
                messages.reply(e)
            }
        }

        // Simplified print messages
        try {
            require('./lib/print')(client, messages);
        } catch (e) {
            console.error(e);
        }
    }
}