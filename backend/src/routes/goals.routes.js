const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const goalsController = require("../controllers/goals.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(goalsController.getGoals));
router.post("/:goalId/contribute", asyncHandler(goalsController.addContribution));

module.exports = router;
