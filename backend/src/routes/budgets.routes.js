const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
    listBudgets,
    createBudget,
    updateBudget,
    deleteBudget
} = require("../controllers/budgets.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listBudgets));
router.post("/", asyncHandler(createBudget));
router.put("/:id", asyncHandler(updateBudget));
router.delete("/:id", asyncHandler(deleteBudget));

module.exports = router;
