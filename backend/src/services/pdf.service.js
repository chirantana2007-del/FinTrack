// Monthly statement PDF renderer (Task 25). Pure vector drawing on a PDFKit
// document — charts are drawn with PDFKit primitives so no image/browser
// dependency is needed. Input is the object from analytics.service
// getMonthlyOverview(), so the PDF always matches the Dashboard numbers.

const C = {
    navy: "#0b1f3a",
    green: "#006c4a",
    amber: "#ac8000",
    red: "#ba1a1a",
    slate: "#4d5f7d",
    text: "#131c28",
    muted: "#75777e",
    light: "#eff4ff",
    border: "#dae3f4",
    white: "#ffffff",
    track: "#e5eeff"
};
const PALETTE = ["#0b1f3a", "#006c4a", "#ac8000", "#4d5f7d", "#7587a7", "#ba1a1a", "#69dba8", "#f6be39"];
const OTHER_COLOR = "#c4c6ce";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40;
const CW = PAGE_W - 2 * M;
const BOTTOM_LIMIT = PAGE_H - 56;

// Helvetica (a PDF base-14 font) has no rupee glyph, so amounts use "Rs.".
const inr = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const inr2 = (n) =>
    `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n) => {
    const v = Math.abs(Number(n) || 0);
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return String(Math.round(v));
};
const pct = (n, digits = 1) => (n === null || n === undefined ? "-" : `${Number(n).toFixed(digits)}%`);
const signedPct = (n) => (n === null || n === undefined ? "n/a" : `${n > 0 ? "+" : ""}${Number(n).toFixed(1)}%`);

function fit(doc, text, maxWidth) {
    let s = String(text ?? "");
    if (doc.widthOfString(s) <= maxWidth) return s;
    while (s.length > 1 && doc.widthOfString(`${s}...`) > maxWidth) {
        s = s.slice(0, -1);
    }
    return `${s}...`;
}

// Single-line text at an absolute position (never moves the flow cursor in a
// way later calls depend on, because every call passes explicit x/y).
function put(doc, text, x, y, { size = 9, font = "Helvetica", color = C.text, width, align = "left", spacing = 0 } = {}) {
    doc.font(font).fontSize(size).fillColor(color);
    const options = { lineBreak: false, align, characterSpacing: spacing };
    let value = String(text ?? "");
    if (width !== undefined) {
        options.width = width;
        value = fit(doc, value, width);
    }
    doc.text(value, x, y, options);
}

function ensureSpace(doc, y, height, label) {
    if (y + height <= BOTTOM_LIMIT) return y;
    doc.addPage();
    doc.rect(0, 0, PAGE_W, 34).fill(C.navy);
    doc.rect(0, 34, PAGE_W, 2).fill(C.green);
    put(doc, "FinTrack", M, 12, { size: 11, font: "Helvetica-Bold", color: C.white });
    put(doc, label, M, 13, { size: 9, color: "#b5c7ea", width: CW, align: "right" });
    return 58;
}

function sectionTitle(doc, y, title, subtitle) {
    doc.rect(M, y + 1, 3, 14).fill(C.green);
    put(doc, title, M + 10, y, { size: 12.5, font: "Helvetica-Bold", color: C.navy });
    if (subtitle) {
        put(doc, subtitle, M + 10, y + 16, { size: 8, color: C.muted });
        return y + 34;
    }
    return y + 26;
}

function card(doc, x, y, w, h, fill = C.light) {
    doc.roundedRect(x, y, w, h, 5).fill(fill);
}

// ---------------------------------------------------------------------------
// Header + KPI cards
// ---------------------------------------------------------------------------
function drawHeader(doc, o) {
    doc.rect(0, 0, PAGE_W, 98).fill(C.navy);
    doc.rect(0, 98, PAGE_W, 4).fill(C.green);

    put(doc, "FinTrack", M, 26, { size: 24, font: "Helvetica-Bold", color: C.white });
    put(doc, "MONTHLY FINANCIAL STATEMENT", M, 58, { size: 8.5, color: "#b5c7ea", spacing: 1.6 });

    put(doc, "STATEMENT PERIOD", M, 28, { size: 7.5, color: "#7587a7", width: CW, align: "right", spacing: 1.2 });
    put(doc, o.period.label, M, 42, { size: 20, font: "Helvetica-Bold", color: C.white, width: CW, align: "right" });
    put(doc, `${o.period.start} to ${o.period.end}`, M, 68, { size: 8.5, color: "#b5c7ea", width: CW, align: "right" });

    const who = o.user ? `${o.user.name}  (${o.user.email})` : "-";
    put(doc, `Prepared for: ${who}`, M, 114, { size: 9, color: C.slate, width: CW * 0.65 });
    put(doc, `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`, M, 114, {
        size: 9,
        color: C.muted,
        width: CW,
        align: "right"
    });
}

function drawKpis(doc, o, y) {
    const t = o.totals;
    const gap = 10;
    const w = (CW - gap * 3) / 4;
    const h = 68;

    const moM = (change, goodWhenDown) => {
        if (change === null || change === undefined) return { text: "no prior-month data", color: C.muted };
        const good = goodWhenDown ? change <= 0 : change >= 0;
        return { text: `${signedPct(change)} vs ${o.period.previousLabel.split(" ")[0]}`, color: good ? C.green : C.red };
    };

    const items = [
        { label: "TOTAL INFLOW", value: inr(t.income), accent: C.green, sub: moM(t.incomeChangePct, false) },
        { label: "TOTAL OUTFLOW", value: inr(t.expense), accent: C.navy, sub: moM(t.expenseChangePct, true) },
        {
            label: "NET SAVINGS",
            value: `${t.net < 0 ? "-" : ""}${inr(Math.abs(t.net))}`,
            accent: t.net >= 0 ? C.green : C.red,
            sub: { text: t.net >= 0 ? "surplus for the month" : "spent more than earned", color: t.net >= 0 ? C.green : C.red }
        },
        {
            label: "SAVINGS RATE",
            value: t.savingsRate === null ? "-" : pct(t.savingsRate),
            accent: C.amber,
            sub: { text: `${t.transactionCount} transactions`, color: C.muted }
        }
    ];

    items.forEach((it, i) => {
        const x = M + i * (w + gap);
        card(doc, x, y, w, h);
        doc.rect(x, y + 8, 3, h - 16).fill(it.accent);
        put(doc, it.label, x + 14, y + 12, { size: 7, font: "Helvetica-Bold", color: C.muted, spacing: 0.8 });
        put(doc, it.value, x + 14, y + 27, { size: 15, font: "Helvetica-Bold", color: C.navy, width: w - 22 });
        put(doc, it.sub.text, x + 14, y + 50, { size: 7.5, font: "Helvetica-Bold", color: it.sub.color, width: w - 22 });
    });

    return y + h + 18;
}

// ---------------------------------------------------------------------------
// Key insights (plain-language callouts)
// ---------------------------------------------------------------------------
function buildInsights(o) {
    const lines = [];
    const t = o.totals;
    const top = o.categories[0];

    if (top) {
        lines.push(`${top.name} is your largest expense: ${inr(top.amount)} (${pct(top.share)} of all spending).`);
    }
    if (t.expenseChangePct !== null && t.previousExpense > 0) {
        const dir = t.expenseChangePct <= 0 ? "down" : "up";
        lines.push(
            `Total spending is ${dir} ${Math.abs(t.expenseChangePct).toFixed(1)}% compared with ${o.period.previousLabel} (${inr(t.previousExpense)}).`
        );
    }
    if (t.savingsRate !== null) {
        lines.push(
            t.net >= 0
                ? `You kept ${pct(t.savingsRate)} of your income this month (${inr(t.net)} saved).`
                : `Spending exceeded income by ${inr(Math.abs(t.net))} this month.`
        );
    }
    if (o.budgets.items.length > 0) {
        const over = o.budgets.items.filter((b) => b.pct >= 100);
        lines.push(
            over.length > 0
                ? `${over.length} of ${o.budgets.items.length} budgets exceeded: ${over.map((b) => b.name).join(", ")}.`
                : `All ${o.budgets.items.length} budgets are within their limits.`
        );
    }
    if (t.needsReviewCount > 0) {
        lines.push(`${t.needsReviewCount} transaction(s) could not be categorised automatically and need review.`);
    }
    return lines.slice(0, 5);
}

function drawInsights(doc, o, y) {
    const lines = buildInsights(o);
    if (lines.length === 0) return y;

    const rowH = 17;
    const h = 30 + lines.length * rowH;
    y = ensureSpace(doc, y, h + 10, o.period.label);

    card(doc, M, y, CW, h);
    put(doc, "KEY INSIGHTS", M + 14, y + 11, { size: 7.5, font: "Helvetica-Bold", color: C.green, spacing: 1.2 });
    lines.forEach((line, i) => {
        const ly = y + 29 + i * rowH;
        doc.circle(M + 18, ly + 4, 2.2).fill(C.green);
        put(doc, line, M + 28, ly, { size: 9, color: C.text, width: CW - 44 });
    });
    return y + h + 20;
}

// ---------------------------------------------------------------------------
// Donut chart + legend
// ---------------------------------------------------------------------------
function wedge(doc, cx, cy, r, a0, a1, color) {
    if (a1 - a0 >= Math.PI * 2 - 0.0001) {
        doc.circle(cx, cy, r).fill(color);
        return;
    }
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    doc.path(`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`)
        .fillColor(color)
        .strokeColor(C.white)
        .lineWidth(1.5)
        .fillAndStroke();
}

function groupedCategories(o, maxSlices = 7) {
    const cats = o.categories;
    const head = cats.slice(0, maxSlices).map((c, i) => ({ name: c.name, amount: c.amount, share: c.share, color: PALETTE[i] }));
    const rest = cats.slice(maxSlices);
    if (rest.length > 0) {
        const amount = rest.reduce((s, c) => s + c.amount, 0);
        head.push({
            name: `Other (${rest.length})`,
            amount,
            share: o.totals.expense ? (amount / o.totals.expense) * 100 : 0,
            color: OTHER_COLOR
        });
    }
    return head;
}

function drawCategoryDonut(doc, o, y) {
    const slices = groupedCategories(o);
    const blockH = Math.max(190, 24 + slices.length * 24);
    y = ensureSpace(doc, y, blockH + 40, o.period.label);
    y = sectionTitle(doc, y, "Spending by Category", `Share of ${inr(o.totals.expense)} total outflow in ${o.period.label}`);

    const cx = M + 92;
    const cy = y + 88;
    const R = 82;
    const hole = 50;

    let angle = -Math.PI / 2;
    const total = slices.reduce((s, c) => s + c.amount, 0) || 1;
    slices.forEach((s) => {
        const sweep = (s.amount / total) * Math.PI * 2;
        wedge(doc, cx, cy, R, angle, angle + sweep, s.color);
        angle += sweep;
    });
    doc.circle(cx, cy, hole).fill(C.white);
    put(doc, "TOTAL SPENT", cx - 45, cy - 14, { size: 6.5, font: "Helvetica-Bold", color: C.muted, width: 90, align: "center", spacing: 0.8 });
    put(doc, inr(o.totals.expense), cx - 48, cy - 2, { size: 11, font: "Helvetica-Bold", color: C.navy, width: 96, align: "center" });
    put(doc, `${slices.length} categories`, cx - 45, cy + 14, { size: 7, color: C.muted, width: 90, align: "center" });

    const lx = M + 210;
    const amountX = lx + 215;
    slices.forEach((s, i) => {
        const ry = y + 6 + i * 24;
        doc.roundedRect(lx, ry + 1, 10, 10, 2).fill(s.color);
        put(doc, s.name, lx + 18, ry, { size: 9.5, font: "Helvetica-Bold", color: C.text, width: 150 });
        put(doc, inr(s.amount), amountX - 70, ry, { size: 9.5, color: C.text, width: 70, align: "right" });
        put(doc, pct(s.share), amountX + 10, ry, { size: 9, color: C.muted, width: 50, align: "right" });
        doc.moveTo(lx, ry + 17).lineTo(CW + M, ry + 17).lineWidth(0.5).strokeColor(C.border).stroke();
    });

    return y + blockH + 14;
}

// ---------------------------------------------------------------------------
// 6-month income vs expense bar chart
// ---------------------------------------------------------------------------
function drawTrendChart(doc, o, y) {
    const chartH = 150;
    y = ensureSpace(doc, y, chartH + 80, o.period.label);
    y = sectionTitle(doc, y, "Income vs Expense", "Six-month trend ending with the statement month");

    const left = M + 34;
    const right = M + CW;
    const top = y + 8;
    const base = top + chartH - 30;
    const plotH = base - top;
    const trend = o.trend;
    const maxVal = Math.max(1, ...trend.map((m) => Math.max(m.income, m.expense)));

    // Round the axis up to a "nice" ceiling so gridline labels read cleanly.
    const magnitude = 10 ** Math.floor(Math.log10(maxVal));
    const niceMax = Math.ceil(maxVal / magnitude) * magnitude;

    for (let i = 0; i <= 4; i += 1) {
        const gy = base - (plotH * i) / 4;
        doc.moveTo(left, gy).lineTo(right, gy).lineWidth(0.5).strokeColor(i === 0 ? C.muted : C.border).stroke();
        put(doc, compact((niceMax * i) / 4), M, gy - 4, { size: 7, color: C.muted, width: 28, align: "right" });
    }

    const groupW = (right - left) / trend.length;
    const barW = Math.min(20, groupW / 3);
    trend.forEach((m, i) => {
        const gx = left + i * groupW + groupW / 2;
        const isFocus = i === trend.length - 1;
        const incH = (m.income / niceMax) * plotH;
        const expH = (m.expense / niceMax) * plotH;

        if (isFocus) {
            doc.roundedRect(gx - groupW / 2 + 4, top - 4, groupW - 8, plotH + 24, 4).fill(C.light);
            // re-stroke the baseline hidden by the highlight
            doc.moveTo(gx - groupW / 2 + 4, base).lineTo(gx + groupW / 2 - 4, base).lineWidth(0.5).strokeColor(C.muted).stroke();
        }
        if (incH > 0) {
            doc.roundedRect(gx - barW - 1.5, base - incH, barW, incH, 1.5).fill(C.green);
            put(doc, compact(m.income), gx - barW - 11, base - incH - 10, { size: 6.5, color: C.green, width: barW + 20, align: "center" });
        }
        if (expH > 0) {
            doc.roundedRect(gx + 1.5, base - expH, barW, expH, 1.5).fill(C.navy);
            put(doc, compact(m.expense), gx - 9, base - expH - 10, { size: 6.5, color: C.navy, width: barW + 20, align: "center" });
        }
        put(doc, m.label, gx - 25, base + 6, {
            size: 8,
            font: isFocus ? "Helvetica-Bold" : "Helvetica",
            color: isFocus ? C.navy : C.muted,
            width: 50,
            align: "center"
        });
    });

    const ly = base + 22;
    doc.roundedRect(right - 150, ly + 1, 9, 9, 2).fill(C.green);
    put(doc, "Income", right - 137, ly, { size: 8, color: C.text });
    doc.roundedRect(right - 80, ly + 1, 9, 9, 2).fill(C.navy);
    put(doc, "Expense", right - 67, ly, { size: 8, color: C.text });

    return ly + 30;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
function tableHeader(doc, y, columns) {
    doc.roundedRect(M, y, CW, 20, 3).fill(C.navy);
    columns.forEach((col) => {
        put(doc, col.label.toUpperCase(), col.x, y + 6.5, { size: 7, font: "Helvetica-Bold", color: C.white, width: col.w, align: col.align || "left", spacing: 0.6 });
    });
    return y + 24;
}

function drawCategoryTable(doc, o, y) {
    const rows = [...o.categories, ...o.droppedCategories];
    if (rows.length === 0) return y;

    const columns = [
        { label: "Category", x: M + 10, w: 150 },
        { label: "This month", x: M + 165, w: 80, align: "right" },
        { label: "Prev. month", x: M + 250, w: 80, align: "right" },
        { label: "Change", x: M + 335, w: 55, align: "right" },
        { label: "Share", x: M + 405, w: 100 }
    ];

    y = ensureSpace(doc, y, 90, o.period.label);
    y = sectionTitle(doc, y, "Category Breakdown", `Month-over-month comparison against ${o.period.previousLabel}`);
    y = tableHeader(doc, y, columns);

    rows.forEach((r, i) => {
        if (y + 22 > BOTTOM_LIMIT) {
            y = ensureSpace(doc, y, 22, o.period.label);
            y = tableHeader(doc, y, columns);
        }
        if (i % 2 === 0) doc.rect(M, y - 3, CW, 21).fill("#f8f9ff");

        const color = PALETTE[i % PALETTE.length];
        doc.roundedRect(M + 10, y + 3, 6, 6, 1.5).fill(r.amount === 0 ? OTHER_COLOR : color);
        put(doc, r.name, M + 22, y + 1, { size: 9, font: "Helvetica-Bold", width: 138 });
        put(doc, inr(r.amount), columns[1].x, y + 1, { size: 9, width: columns[1].w, align: "right" });
        put(doc, inr(r.prevAmount), columns[2].x, y + 1, { size: 9, color: C.muted, width: columns[2].w, align: "right" });

        const up = r.changePct !== null && r.changePct > 0;
        const changeColor = r.changePct === null ? C.muted : up ? C.red : C.green;
        put(doc, signedPct(r.changePct), columns[3].x, y + 1, { size: 8.5, font: "Helvetica-Bold", color: changeColor, width: columns[3].w, align: "right" });

        doc.roundedRect(columns[4].x, y + 3, 70, 6, 3).fill(C.track);
        if (r.share > 0) doc.roundedRect(columns[4].x, y + 3, Math.max(4, (70 * r.share) / 100), 6, 3).fill(color);
        put(doc, pct(r.share), columns[4].x + 74, y + 1, { size: 8, color: C.muted, width: 32 });
        y += 21;
    });

    // Totals row
    doc.roundedRect(M, y, CW, 22, 3).fill(C.light);
    put(doc, "Total", M + 22, y + 6, { size: 9.5, font: "Helvetica-Bold", color: C.navy });
    put(doc, inr(o.totals.expense), columns[1].x, y + 6, { size: 9.5, font: "Helvetica-Bold", color: C.navy, width: columns[1].w, align: "right" });
    put(doc, inr(o.totals.previousExpense), columns[2].x, y + 6, { size: 9, color: C.muted, width: columns[2].w, align: "right" });
    const tc = o.totals.expenseChangePct;
    put(doc, signedPct(tc), columns[3].x, y + 6, { size: 9, font: "Helvetica-Bold", color: tc === null ? C.muted : tc > 0 ? C.red : C.green, width: columns[3].w, align: "right" });

    return y + 40;
}

function drawBudgets(doc, o, y) {
    const items = o.budgets.items;
    y = ensureSpace(doc, y, 90, o.period.label);
    y = sectionTitle(
        doc,
        y,
        "Budget Performance",
        items.length ? `${inr(o.budgets.totalSpent)} spent of ${inr(o.budgets.totalLimit)} budgeted (${pct(o.budgets.pct)})` : "Spending limits set for this month"
    );

    if (items.length === 0) {
        card(doc, M, y, CW, 34);
        put(doc, "No budgets were set for this month. Create budgets on the Budgets page to track them here.", M + 14, y + 12, { size: 9, color: C.muted, width: CW - 28 });
        return y + 54;
    }

    items.forEach((b) => {
        y = ensureSpace(doc, y, 32, o.period.label);
        const color = b.pct >= 100 ? C.red : b.pct >= 80 ? C.amber : C.green;
        const status = b.pct >= 100 ? "OVER LIMIT" : b.pct >= 80 ? "NEAR LIMIT" : "ON TRACK";

        put(doc, b.name, M, y, { size: 9.5, font: "Helvetica-Bold", width: 190 });
        put(doc, `${inr(b.spent)} / ${inr(b.limit)}`, M + 190, y, { size: 9, color: C.muted, width: 160, align: "right" });
        put(doc, `${pct(b.pct)}  ${status}`, M + 360, y, { size: 8, font: "Helvetica-Bold", color, width: CW - 360, align: "right" });
        doc.roundedRect(M, y + 15, CW, 7, 3.5).fill(C.track);
        doc.roundedRect(M, y + 15, Math.max(5, (CW * Math.min(100, b.pct)) / 100), 7, 3.5).fill(color);
        y += 32;
    });

    return y + 12;
}

function drawTopMerchants(doc, o, y) {
    const list = o.topMerchants;
    if (list.length === 0) return y;

    y = ensureSpace(doc, y, 40 + list.length * 24, o.period.label);
    y = sectionTitle(doc, y, "Top Merchants", "Where most of the money went");

    const max = Math.max(...list.map((m) => m.total), 1);
    list.forEach((m, i) => {
        put(doc, `${i + 1}`, M, y + 1, { size: 9, font: "Helvetica-Bold", color: C.muted, width: 14 });
        put(doc, m.name, M + 18, y + 1, { size: 9.5, font: "Helvetica-Bold", width: 170 });
        doc.roundedRect(M + 195, y + 3, 200, 7, 3.5).fill(C.track);
        doc.roundedRect(M + 195, y + 3, Math.max(5, (200 * m.total) / max), 7, 3.5).fill(PALETTE[i % PALETTE.length]);
        put(doc, `${inr(m.total)}`, M + 405, y + 1, { size: 9, width: 70, align: "right" });
        put(doc, `${m.count} txn`, M + 480, y + 1, { size: 8, color: C.muted, width: CW - 480, align: "right" });
        y += 24;
    });

    return y + 12;
}

function drawRecurring(doc, o, y) {
    const subs = o.subscriptions;
    if (!subs || subs.count === 0) return y;

    y = ensureSpace(doc, y, 60 + subs.items.length * 20, o.period.label);
    y = sectionTitle(doc, y, "Recurring Payments", `${subs.count} subscription(s), about ${inr(subs.monthlyTotal)} per month`);

    const columns = [
        { label: "Merchant", x: M + 10, w: 220 },
        { label: "Amount", x: M + 240, w: 90, align: "right" },
        { label: "Cadence", x: M + 350, w: 70 },
        { label: "Next due", x: M + 430, w: 85, align: "right" }
    ];
    y = tableHeader(doc, y, columns);

    subs.items.forEach((s, i) => {
        if (y + 20 > BOTTOM_LIMIT) {
            y = ensureSpace(doc, y, 20, o.period.label);
            y = tableHeader(doc, y, columns);
        }
        if (i % 2 === 0) doc.rect(M, y - 3, CW, 19).fill("#f8f9ff");
        put(doc, s.merchant, columns[0].x, y + 1, { size: 9, font: "Helvetica-Bold", width: columns[0].w });
        put(doc, inr(s.amount), columns[1].x, y + 1, { size: 9, width: columns[1].w, align: "right" });
        put(doc, s.cadence, columns[2].x, y + 1, { size: 8.5, color: C.muted, width: columns[2].w });
        put(doc, s.nextDue ? String(s.nextDue).slice(0, 10) : "-", columns[3].x, y + 1, { size: 8.5, color: C.muted, width: columns[3].w, align: "right" });
        y += 19;
    });

    return y + 20;
}

function drawRecentTransactions(doc, o, y) {
    const list = o.recentTransactions;
    if (list.length === 0) return y;

    const columns = [
        { label: "Date", x: M + 10, w: 60 },
        { label: "Description", x: M + 78, w: 200 },
        { label: "Category", x: M + 285, w: 110 },
        { label: "Amount", x: M + 400, w: 105, align: "right" }
    ];

    y = ensureSpace(doc, y, 90, o.period.label);
    y = sectionTitle(doc, y, "Latest Transactions", `Most recent ${list.length} entries in ${o.period.label}`);
    y = tableHeader(doc, y, columns);

    list.forEach((t, i) => {
        if (y + 20 > BOTTOM_LIMIT) {
            y = ensureSpace(doc, y, 20, o.period.label);
            y = tableHeader(doc, y, columns);
        }
        if (i % 2 === 0) doc.rect(M, y - 3, CW, 19).fill("#f8f9ff");
        put(doc, String(t.date).slice(0, 10), columns[0].x, y + 1, { size: 8.5, color: C.muted, width: columns[0].w });
        put(doc, t.description, columns[1].x, y + 1, { size: 9, width: columns[1].w });
        put(doc, t.category, columns[2].x, y + 1, { size: 8.5, color: C.slate, width: columns[2].w });
        const credit = t.amount > 0;
        put(doc, `${credit ? "+" : "-"} ${inr2(Math.abs(t.amount))}`, columns[3].x, y + 1, {
            size: 9,
            font: "Helvetica-Bold",
            color: credit ? C.green : C.text,
            width: columns[3].w,
            align: "right"
        });
        y += 19;
    });

    return y + 16;
}

function drawEmptyState(doc, o, y) {
    card(doc, M, y, CW, 120);
    doc.circle(PAGE_W / 2, y + 38, 16).fill(C.border);
    put(doc, "!", PAGE_W / 2 - 20, y + 30, { size: 18, font: "Helvetica-Bold", color: C.navy, width: 40, align: "center" });
    put(doc, "No transactions recorded for this period", M, y + 66, { size: 12, font: "Helvetica-Bold", color: C.navy, width: CW, align: "center" });
    put(doc, "Upload a bank statement CSV, then export this report again.", M, y + 86, { size: 9, color: C.muted, width: CW, align: "center" });
    return y + 140;
}

function drawFooters(doc, o) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
        doc.switchToPage(i);
        // Footer sits inside the bottom margin; zero it so PDFKit does not
        // auto-insert a new page while writing there.
        const prevBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.moveTo(M, PAGE_H - 36).lineTo(PAGE_W - M, PAGE_H - 36).lineWidth(0.5).strokeColor(C.border).stroke();
        put(doc, "FinTrack  |  Personal Finance Analytics  |  Confidential", M, PAGE_H - 28, { size: 7.5, color: C.muted });
        put(doc, `Page ${i - range.start + 1} of ${range.count}`, M, PAGE_H - 28, { size: 7.5, color: C.muted, width: CW, align: "right" });
        doc.page.margins.bottom = prevBottom;
    }
}

function renderMonthlyReport(doc, overview) {
    drawHeader(doc, overview);
    let y = 138;
    y = drawKpis(doc, overview, y);

    if (overview.totals.transactionCount === 0) {
        drawEmptyState(doc, overview, y);
        drawFooters(doc, overview);
        return;
    }

    y = drawInsights(doc, overview, y);
    y = drawCategoryDonut(doc, overview, y);
    y = drawTrendChart(doc, overview, y);
    y = drawCategoryTable(doc, overview, y);
    y = drawBudgets(doc, overview, y);
    y = drawTopMerchants(doc, overview, y);
    y = drawRecurring(doc, overview, y);
    drawRecentTransactions(doc, overview, y);
    drawFooters(doc, overview);
}

module.exports = { renderMonthlyReport };
