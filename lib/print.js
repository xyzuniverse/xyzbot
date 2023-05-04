const chalk = require('chalk');
const PhoneNumber = require('awesome-phonenumber');

module.exports = async(client, messages) => {
    let chats = await messages.getChat();
    let user = await messages.getContact();
    let colors = [
        "red",
        "green",
        "blue",
        "yellow",
        "magenta",
        "cyan",
        "redBright",
        "greenBright",
        "blueBright",
        "yellowBright",
        "magentaBright",
        "cyanBright",
    ];

    // The header of the chat
    let header_client = chalk.red("~ " + client.info.pushname + " " + PhoneNumber("+" + client.info.wid.user).getNumber("international")) + " " + chalk.black(chalk.bgGreenBright(client.info.platform)) + " " + chalk.black(chalk.bgYellow((messages.timestamp ? new Date(1000 * (messages.timestamp.low || messages.timestamp)) : new Date).toTimeString()))
    let header_sender = chalk[pickRandom(colors)]("~ " + user.pushname + " " + PhoneNumber("+" + user.number).getNumber("international")) + " to " + chalk.green(messages.from + " " + chats.name) + " " +  chalk.black(chalk.bgYellow(messages.type))
    console.log(header_client + "\n" + header_sender + "\n" + messages.body + '\n')
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}
