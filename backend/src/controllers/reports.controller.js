const PDFDocument = require("pdfkit");
const { resolvePeriod, getMonthlyOverview } = require("../services/analytics.service");
const { renderMonthlyReport } = require("../services/pdf.service");

// The statement defaults to the most recent *completed* month that has data
// (a report for a month that just started would be nearly empty).
async function loadOverview(req) {
    const { month, availableMonths } = await resolvePeriod(req.user.id, req.query.month, { preferComplete: true });
    return getMonthlyOverview(req.user.id, month, { availableMonths });
}

// GET /api/reports/summary[?month=YYYY-MM] — same data the PDF is built from.
exports.getReportSummary = async (req, res) => {
    const data = await loadOverview(req);
    res.json({ success: true, data });
};

// GET /api/reports/export[?month=YYYY-MM] — PDF download.
exports.exportMonthlyReport = async (req, res) => {
    // All DB work happens before any header is sent, so a failure still
    // reaches errorHandler as a normal JSON error instead of a broken PDF.
    const overview = await loadOverview(req);

    const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
        info: {
            Title: `FinTrack Statement - ${overview.period.label}`,
            Author: "FinTrack",
            Subject: "Monthly financial statement"
        }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="FinTrack_Report_${overview.period.month.slice(0, 7)}.pdf"`
    );
    doc.on("error", (err) => {
        console.error("PDF export error:", err);
        res.destroy(err);
    });
    doc.pipe(res);

    renderMonthlyReport(doc, overview);
    doc.end();
};

// GET /api/reports/export-csv[?month=YYYY-MM] — CSV download.
exports.exportMonthlyReportCsv = async (req, res) => {
    const overview = await loadOverview(req);
    
    // Build CSV manually
    let csv = "Category,Total Spent,Budget,Variance\n";
    for (const cat of overview.categories) {
        csv += `"${cat.name}",${cat.total},${cat.budget || 0},${cat.variance || 0}\n`;
    }
    
    csv += "\nTransaction Date,Merchant,Description,Category,Account,Amount\n";
    for (const t of overview.recentTransactions) {
        csv += `"${t.date}","${t.merchant}","${t.description}","${t.category}","${t.account}",${t.amount}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="FinTrack_Report_${overview.period.month.slice(0, 7)}.csv"`
    );
    res.send(csv);
};
