const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createSubscriptionNotification,
  createBudgetNotification,
  createAnomalyNotification
} = require("../services/notification.service");

const router = express.Router();

router.post("/subscription", authMiddleware, (req, res) => {
  const { merchant, amount } = req.body;

  if (!merchant || amount === undefined) {
    return res.status(400).json({
      message: "Merchant and amount are required"
    });
  }

  const notification = createSubscriptionNotification(
    merchant,
    amount
  );

  return res.status(201).json(notification);
});

router.post("/budget", authMiddleware, (req, res) => {
  const { category, percentage } = req.body;

  if (!category || percentage === undefined) {
    return res.status(400).json({
      message: "Category and percentage are required"
    });
  }

  const notification = createBudgetNotification(
    category,
    percentage
  );

  return res.status(201).json(notification);
});

router.post("/anomaly", authMiddleware, (req, res) => {
  const { description, amount } = req.body;

  if (!description || amount === undefined) {
    return res.status(400).json({
      message: "Description and amount are required"
    });
  }

  const notification = createAnomalyNotification(
    description,
    amount
  );

  return res.status(201).json(notification);
});

module.exports = router;