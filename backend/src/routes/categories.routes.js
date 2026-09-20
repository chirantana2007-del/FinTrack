const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categories.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listCategories));
router.post("/", asyncHandler(createCategory));
router.put("/:id", asyncHandler(updateCategory));
router.delete("/:id", asyncHandler(deleteCategory));

module.exports = router;
