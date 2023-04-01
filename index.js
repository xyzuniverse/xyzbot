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
const path = require('path')
const syntaxerror = require('syntax-error')

// Prevent to crash if error occured
process.on('uncaughtException', console.error)

// Plugin loader
const pluginFolder = path.join(__dirname, 'plugins')
const pluginFilter = fs.readdirSync(pluginFolder, { withFileTypes: true }).filter(v => v.isDirectory())
const pluginFile = filename => /\.js$/.test(filename)

pluginFilter.map(async ({ name }) => {
global.plugins = {}
let files = await fs.readdirSync(path.join(pluginFolder, name))
    for(let filename of files) {
        try {
            global.plugins[filename] = require(path.join(pluginFolder, name, filename))
            fs.watch(pluginFolder + "/" + name, global.reload)
        } catch (e) {
            logger.error(e)
            delete global.plugins[filename]
        }
    }
})
logger.info("All plugins has been loaded.")

global.reload = async (_event, filename) => {
    if (pluginFile(filename)) {
      let subdirs = await fs.readdirSync(pluginFolder)
      subdirs.forEach((files) => {
        let dir = path.join(pluginFolder, files, filename)
        if (fs.existsSync(dir)) {
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
      })
    }
  }
Object.freeze(global.reload)

// Bot prefix
global.prefix = new RegExp('^[' + (('‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&')) + ']')

/**
 * Init the WA Web connection
 * @returns
 */
const initConnection = async () => {
    const { state, saveCreds } = await useMultiFileAuthState("sessions")
    const { version, isLatest } = await fetchLatestBaileysVersion()
    logger.info(`connecting using version ${version.join(`.`)}, latest: ${isLatest}`)

    // Initialize the events
    global.conn = initWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: logger,
        version
    })
    
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
    })

    // Credentials update event
    conn.ev.on("creds.update", saveCreds)

    // Chats message event
    conn.ev.on("messages.upsert", require('./handler').handler.bind(conn))

    // Connection helper
    require('./lib/socketHelper').socketHelper(conn);

    return conn
}

initConnection().catch(e => console.log(e))
