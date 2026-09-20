const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const { listTransactions } = require("../controllers/transactions.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listTransactions));

module.exports = router;
