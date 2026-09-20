const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/adminOnly.middleware");

const router = express.Router();

router.get("/dashboard", authMiddleware, adminOnly, (req, res) => {
  return res.status(200).json({
    message: "Admin dashboard access granted",
    admin: req.user
  });
});

module.exports = router;