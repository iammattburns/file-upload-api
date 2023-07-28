const express = require("express");
const router = express.Router();

const multer = require("multer");

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

module.exports = router;
