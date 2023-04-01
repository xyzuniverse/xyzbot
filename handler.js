module.exports = {
    async handler(msgEvent) {
        // The message handler
        try {
            let m = require('./socketHelper').messageHelper(conn, msgEvent?.messages[0])
            console.log(JSON.stringify(m, null, 2))

            // Plugin manager, and executor
            let usedPrefix;
            for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
                let match = (_prefix instanceof RegExp ? // RegExp Mode?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                    let re = p instanceof RegExp ? // RegExp in Array?
                        p :
                        new RegExp(str2Regex(p))
                    return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                    [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                    [[[], new RegExp]]
                ).find(p => p[1])
                if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? // Array?
                    plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                        cmd.test(command) :
                        cmd === command
                    ) :
                    typeof plugin.command === 'string' ? // String?
                        plugin.command === command :
                        false

                if (!isAccept) continue
                m.plugin = name
                m.isCommand = true
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                }
                try {
                    await plugin.call(this, m, extra)
                } catch (e) {
                    console.log(e)
                }
            }
        }
        } catch (e) {
            console.log(e)
        }
    }
}