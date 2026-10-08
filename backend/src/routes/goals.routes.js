const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const goalsController = require("../controllers/goals.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(goalsController.getGoals));
router.post("/", asyncHandler(goalsController.createGoal));
router.get("/:goalId", asyncHandler(goalsController.getGoal));
router.put("/:goalId", asyncHandler(goalsController.updateGoal));
router.delete("/:goalId", asyncHandler(goalsController.deleteGoal));
router.post("/:goalId/contribute", asyncHandler(goalsController.addContribution));

module.exports = router;
