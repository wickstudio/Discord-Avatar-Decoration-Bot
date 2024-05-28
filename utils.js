const axios = require("axios");
const sharpApng = require("sharp-apng");

async function downloadAPNG(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const data = Buffer.from(response.data);
  const frames = await sharpApng.framesFromApng(data);
  return frames

}

module.exports = downloadAPNG