const multer = require("multer");
const sharp = require("sharp");
sharp.cache(false);
const fs = require("fs");

const MIME_TYPE = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Check if there is an image file to process
    if (req.file) {
      try {
        // Customize image filename
        const filename = req.file.originalname.split(" ").join("_");
        const filenameArray = filename.split(".");
        filenameArray.pop();
        const filenameWithoutExtension = filenameArray.join(".");
        const ref = `${filenameWithoutExtension + Date.now()}.webp`;

        // Resize and convert to Webp using sharp
        const buffer = await sharp(req.file.buffer)
          .resize({ width: 206, height: 260 })
          .toFormat("webp", { quality: 85 })
          .toBuffer();

        // Save the WebP version
        fs.writeFileSync(`./images/${ref}`, buffer);

        // Update req.file.filename
        // the file name is used in book routes to get image url
        req.file.filename = ref;
      } catch (error) {
        return res.status(500).json({ error: "Error processing image" });
      }
    }

    next();
  });
};
