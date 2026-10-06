const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');

// Optional: require auth middleware if member 1/2 created it
// const auth = require('../middleware/auth.middleware');
// For now, we will use it without middleware or we can apply it if needed.

router.get('/prediction', insightsController.getPrediction);
router.get('/anomalies', insightsController.getAnomalies);
router.post('/nl-query', insightsController.nlQuery);

module.exports = router;
