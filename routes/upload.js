const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

/* POST upload. */
router.post("/", (req, res, next) => {
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const uploadFile = multer({ storage: storage }).any();
  try {
    uploadFile(req, res, (err) => {
      if (err) {
        console.log("Error uploading file: ", err.message);
        res.status(400).send("Something went wrong!");
      }
      res.status(200).send("Uploaded successfully");
    });
  } catch (err) {
    console.error(`Error with upload `, err.message);
    next(err);
  }
});

function sanitizeFile(file, cb) {
  // Define the allowed extension
  const fileExts = [".pdf", ".txt", ".png", ".jpg", ".jpeg", ".svg"];

  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
    path.extname(file.originalname.toLowerCase())
  );

  // Mime type must be an image
  const isAllowedMimeType = file.mimetype.startsWith("image/");

  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true); // no errors
  } else {
    // pass error msg to callback, which can be displaye in frontend
    cb("Error: File type not allowed!");
  }
}

router.post("/s3", (req, res, next) => {
  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY, // store it in .env file to keep it safe
      secretAccessKey: process.env.AWS_S3_ACCESS_KEY_SECRET,
    },
    region: process.env.AWS_S3_REGION, // this is the region that you select in AWS account
  });

  const s3Storage = multerS3({
    s3: s3, // s3 instance
    bucket: process.env.AWS_S3_BUCKET, // change it as per your project requirement
    acl: "public-read", // storage access type
    metadata: (req, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName =
        Date.now() + "_" + file.fieldname + "_" + file.originalname;
      cb(null, fileName);
    },
  });

  const uploadFile = multer({
    storage: s3Storage,
    fileFilter: (req, file, callback) => {
      sanitizeFile(file, callback);
    },
    limits: {
      fileSize: 1024 * 1024 * 5, // 5mb file size
    },
  }).any();

  try {
    uploadFile(req, res, (err) => {
      if (err) {
        console.log("Error uploading file: ", err.message);
        res.status(400).send(`Error uploading file: ${err.message}`);
      }
      res.status(200).send("Uploaded successfully");
    });
  } catch (err) {
    console.error(`Error with upload `, err.message);
    next(err);
  }
});

module.exports = router;
