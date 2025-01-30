const fs = require('fs');
const { exec } = require('child_process');

function main() {
    const files = fs.readdirSync("./");
    for (let file of files.filter(a => a.endsWith("png"))) {
        exec(`mv "${file}" ${file.replace("png", "jpg")}`)
    }
}

main()