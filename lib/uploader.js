const { fromBuffer } = require("file-type");
var FormData = require("form-data");
const axios = require("axios");
module.exports = {
  /**
   * Upload image to telegra.ph
   * Supported mimetype:
   * - `image/jpeg`
   * - `image/jpg`
   * - `image/png`s
   * @param {Buffer} buffer Image Buffer
   */
  async uploadImageToTelegraph(buffer) {
    const { ext } = await fromBuffer(buffer);
    let form = new FormData();
    //let array = Uint8Array.from(buffer);
    //let blob = new Blob([array], { type: "application/octet-stream" });
    form.append("file", buffer, "tmp." + ext);

    try {
      let response = await axios.post("https://telegra.ph/upload", form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      let img = response.data;
      if (img.error) throw img.error;

      return "https://telegra.ph" + img[0].src;
    } catch (error) {
      throw new Error(`Error uploading image: ${error.message}`);
    }
  },
};
