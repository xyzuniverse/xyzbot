const sagiri = require("sagiri");
const { uploadImageToTelegraph } = require("../../lib/uploader.js");

let handler = async (msg, { client, text }) => {
  let q = msg.hasQuotedMsg ? await msg.getQuotedMessage() : msg;
  const isImage = q.hasMedia && q.type.includes("image");
  if (!isImage) return msg.reply("Insert a picture!");
  if (isImage) {
    msg.react("⚡");
    const file = Buffer.from(await (await q.downloadMedia()).data, "base64");
    const url = await uploadImageToTelegraph(file);

    let results;
    try {
      const sagiri_client = sagiri(global.apiKey.sagiri, { results: 10 });
      results = await sagiri_client(url);
    } catch (e) {
      return msg.reply("A error occured while trying request into server, please try again");
    } finally {
      let result = [];
      console.log(JSON.stringify(results));
      results.forEach((list) => {
        if (list.similarity > 80 && "source" in list.raw.data) {
          result.push({
            site: list.raw.data.ext_urls,
            author: list.raw.data.creator,
            name: list.raw.data.material,
            source: list.raw.data.source,
            ...(list.raw.data.characters ? { character: list.raw.data.characters } : {}),
          });
        }
      });

      if (!result) {
        return msg.reply("Oops, no sources found, make sure the image not cropped and try again!");
      } else {
        let author = [];
        let source = [];
        let name = [];
        let sites = [];
        let characters = [];
        result.forEach((a) => {
          author.push(a.author);
          name.push(a.name);
          source.push(`- ${a.source}`);
          a.site.map((c) => sites.push(`- ${c}`));
          if (a.character) {
            characters.push(a.character);
          }
        });
        return msg.reply(
          `${characters.length > 0 ? `Character: ${hasDuplicateStrings(characters) ? characters[0] : characters.join(", ")}` : ""}\nMaterial/s: ${
            hasDuplicateStrings(name) ? name[0] : name.join(", ")
          }\nAuthor/s: ${hasDuplicateStrings(author) ? author[0] : author.join(", ")}\nSources:\n${source.join("\n")}\n\nSites:\n${sites.join("\n")}`
        );
      }
    }
  }
};

handler.help = ["animepicsource <insert anime pictures>", "saus <insert anime picture>"];
handler.tags = ["tools"];
handler.private = true;
handler.command = /^(animepicsource|saus)$/i;

module.exports = handler;

function hasDuplicateStrings(array) {
  const uniqueStrings = new Set();

  for (const item of array) {
    if (uniqueStrings.has(item)) {
      return true; // Duplicate string found
    }
    uniqueStrings.add(item);
  }

  return false; // No duplicate strings found
}
