const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const analyticsController = require("../controllers/analytics.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", asyncHandler(analyticsController.getDashboard));

module.exports = router;
