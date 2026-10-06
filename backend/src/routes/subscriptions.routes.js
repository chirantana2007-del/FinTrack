const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
    listSubscriptions,
    detectSubscriptions,
    updateSubscription
} = require("../controllers/subscriptions.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listSubscriptions));
router.post("/detect", asyncHandler(detectSubscriptions));
router.patch("/:id", asyncHandler(updateSubscription));

module.exports = router;
