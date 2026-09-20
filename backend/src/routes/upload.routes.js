const express = require("express");
const multer = require("multer");
const { parseStatement } = require("../services/parsing.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});

router.post("/csv", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV file is required"
      });
    }

    const transactions = parseStatement(req.file.buffer.toString("utf-8"));

    return res.status(200).json({
      message: "CSV parsed successfully",
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("CSV upload error:", error);

    return res.status(400).json({
      message: error.message || "Failed to parse CSV"
    });
  }
});

module.exports = router;