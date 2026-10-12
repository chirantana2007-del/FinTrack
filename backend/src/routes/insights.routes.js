const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const insightsController = require('../controllers/insights.controller');

const router = express.Router();

// Everything here is calculated from the signed-in user's own transactions.
router.use(authMiddleware);

router.get('/prediction', asyncHandler(insightsController.getPrediction));
router.get('/anomalies', asyncHandler(insightsController.getAnomalies));
router.post('/nl-query', asyncHandler(insightsController.nlQuery));

module.exports = router;
