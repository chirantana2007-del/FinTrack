const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/adminOnly.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  getDashboard,
  listUsers,
  listUploads,
  listAuditLog
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/dashboard", asyncHandler(getDashboard));
router.get("/users", asyncHandler(listUsers));
router.get("/uploads", asyncHandler(listUploads));
router.get("/audit-log", asyncHandler(listAuditLog));

module.exports = router;
