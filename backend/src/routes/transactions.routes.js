const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const { listTransactions, exportTransactions } = require("../controllers/transactions.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/export", asyncHandler(exportTransactions));
router.get("/", asyncHandler(listTransactions));

module.exports = router;
