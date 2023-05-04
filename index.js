const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode-terminal');
const logger = require('pino')({
    transport: {
        target: "pino-pretty",
        options: {
            levelFirst: true,
            ignore: "hostname",
            translateTime: true,
        }
    }
}).child({ creator: "xyzuniverse" });

async function ClientConnect() {
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ["--no-sandbox", "--disable-gpu"]
        }
    });

    // Webloading event
    client.on('loading_screen', (percent) => {
        logger.info(`Connecting, loading web... Status: ${percent}%`);
    });

    // QR event
    client.on('qr', qr => {
        QRCode.generate(qr, { small: true });
        logger.info("Scan QR code to continue.");
    });

    // Tell the user if client is ready
    client.on('ready', () => {
        logger.info("Opened connection to WA Web")
        logger.info("Client bot is ready!");
    });

    // Message event
    client.on('message', messages => require('./handler').handler(client, messages));

    // Initialize the client
    client.initialize();
    logger.info("Connecting to WA Web")

    return client;
}

ClientConnect()
.catch(e => console.error(e))
