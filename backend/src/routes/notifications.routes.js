const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notifications.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listNotifications));
// Registered before /:id/read so "read-all" is never captured as an id.
router.patch("/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/:id/read", asyncHandler(markNotificationRead));

module.exports = router;
