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
            args: ["--no-sandbox"]
        }
    });

    client.on('qr', qr => {
        QRCode.generate(qr, { small: true });
        logger.info("Scan QR code to continue.");
    });

    client.on('ready', () => {
        logger.info("Opened connection to WA Web")
        logger.info("Client bot is ready!");
    });

    client.on('message', (messages) => {
        console.log(JSON.stringify(messages, null, 2));
    });

    client.initialize();
    logger.info("Connecting to WA Web")

    return client;
}

ClientConnect()
.catch(e => console.error(e))