const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const reportsController = require("../controllers/reports.controller");

const router = express.Router();

router.use(authMiddleware);

// GET /api/reports/summary[?month=YYYY-MM] -> JSON for the Report page preview
router.get("/summary", asyncHandler(reportsController.getReportSummary));
// GET /api/reports/export[?month=YYYY-MM]  -> PDF download
router.get("/export", asyncHandler(reportsController.exportMonthlyReport));
// GET /api/reports/export-csv[?month=YYYY-MM]  -> CSV download
router.get("/export-csv", asyncHandler(reportsController.exportMonthlyReportCsv));

module.exports = router;
