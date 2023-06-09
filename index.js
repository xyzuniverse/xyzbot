let { spawn } = require("child_process");
let path = require("path");
let fs = require("fs");
let package = require("./package.json");
let cfonts = require("cfonts");
let bannerStr = `${package.name} by ${package.author}`;

// Banner
let colors = ["green", "blue", "magenta", "cyan"];
cfonts.say(package.name, {
  font: "block",
  align: "center",
  gradient: [pickRandom(colors), pickRandom(colors)],
});
cfonts.say(bannerStr, {
  font: "console",
  align: "center",
});
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
      case "exit":
        process.exit();
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

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
