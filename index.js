let { spawn } = require("child_process");
let path = require("path");
let fs = require("fs");
let package = require("./package.json");
let figlet = require("figlet");
let lolcatjs = require("lolcatjs");
lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.colors = true;

let _banner = figlet.textSync(package.name, {
  font: "ANSI Shadow",
});
let bannerStr = `${package.name} by ${package.author}`;

// Banner
console.log("\n");
for (let str of _banner.split("\n")) {
  lolcatjs.fromString(centerString(str));
}
lolcatjs.fromString(centerString(bannerStr) + "\n\n");
console.log("Starting...");

var isRunning = false;
/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
  if (isRunning) return;
  isRunning = true;
  let args = [path.join(__dirname, file), ...process.argv.slice(2)];
  let p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  p.on("message", (data) => {
    console.log("[RECEIVED]", data);
    switch (data) {
      case "reset":
        p.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "uptime":
        p.send(process.uptime());
        break;
    }
  });
  p.on("exit", (code) => {
    isRunning = false;
    console.error("Exited with code:", code);
    if (code === 0) return;
    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0]);
      start(file);
    });
  });
}

start("main.js");

function centerString(str) {
  let columns = process.stdout.columns;
  if (columns == 0) columns = 80;
  let space = columns - str.length;
  let spaceRepeat = " ".repeat(space / 2);
  return `${spaceRepeat}${str}${spaceRepeat}`;
}
