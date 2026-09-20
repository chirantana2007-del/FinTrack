const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
    listAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount
} = require("../controllers/accounts.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listAccounts));
router.get("/:id", asyncHandler(getAccount));
router.post("/", asyncHandler(createAccount));
router.put("/:id", asyncHandler(updateAccount));
router.delete("/:id", asyncHandler(deleteAccount));

module.exports = router;
