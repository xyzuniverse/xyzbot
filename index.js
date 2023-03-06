// Load the modules
const {
    default: initWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
} = require('baileys')

const logger = require("pino")({
    transport: {
        target: "pino-pretty",
        options: {
            levelFirst: true,
            ignore: "hostname",
            translateTime: true
        }
    }
}).child({ class: "Baileys" })
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const store_system = require("./lib/store.js")
const path = require("path")
const _ = require('lodash')
const yargs = require("yargs/yargs")

// Prevent to crash if error occured
process.on('uncaughtException', console.error)

// Plugin manager
let pluginFolder = path.join(__dirname, 'plugins')
let pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
  try {
    global.plugins[filename] = require(path.join(pluginFolder, filename))
  } catch (e) {
    logger.error(e)
    delete global.plugins[filename]
  }
}
console.log(Object.keys(global.plugins))
global.reload = (_ev, filename) => {
  if (pluginFilter(filename)) {
    let dir = path.join(pluginFolder, filename)
    if (dir in require.cache) {
      delete require.cache[dir]
      if (fs.existsSync(dir)) logger.info(`re - require plugin '${filename}'`)
      else {
        logger.warn(`deleted plugin '${filename}'`)
        return delete global.plugins[filename]
      }
    } else logger.info(`requiring new plugin '${filename}'`)
    let err = syntaxerror(fs.readFileSync(dir), filename)
    if (err) logger.error(`syntax error while loading '${filename}'\n${err}`)
    else try {
      global.plugins[filename] = require(dir)
    } catch (e) {
      logger.error(e)
    } finally {
      global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
    }
  }
}
Object.freeze(global.reload)
fs.watch(path.join(__dirname, 'plugins'), global.reload)

// Options
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

// Prefix
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

/**
 * Init the WA Web connection
 * @returns
 */
const initConnection = async () => {
    // Database loader
    global._db = new(require('./lib/localdb'))("database")
    global.db = {users:[], chats:[], groups:[], statistic:{}, sticker:{}, setting:{}, ...(await _db.fetch() ||{})}
    await _db.save(global.db)
    setInterval(async () => {
      if (global.db) await _db.save(global.db)
    }, 30_000)

    const { state, saveCreds } = await store_system.useMultiFileAuthState("sessions")
    const { version, isLatest } = await fetchLatestBaileysVersion()
    logger.info(`connecting using version ${version.join(`.`)}, latest: ${isLatest}`)

    // Initialize the events
    global.conn = initWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: logger,
        version
    })
    
    // Load connection helper
    require("./lib/message_helper").connectionHelper(conn)
    
    // Add logger into socket
    conn.logger = logger

    // Connection update event
    conn.ev.on("connection.update", async update => {
        var { connection, lastDisconnect } = update
        if (connection === 'close') {
            logger.info("conection lost, reconnecting for a few seconds...")
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                initConnection()
            } else { 
                logger.error("Disconnected from server because you're logged out, please regenerate a new session.")
                conn.logout()
                fs.unlinkSync("./sessions")
                process.exit()
            }
        }
        if (global.db.data === null) await global.loadDatabase()
    })

    // Credentials update event
    conn.ev.on("creds.update", saveCreds)

    // Chats message event
    conn.ev.on("messages.upsert", require("./handler.js").handler.bind(conn))
    return conn
}

initConnection().catch(e => console.log(e))
