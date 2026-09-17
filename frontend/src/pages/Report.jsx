import React from 'react';

export default function Report() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full max-w-[1440px] mx-auto gap-space-lg">
{/*  Interactive Export & Utility Header Toolbar  */}
<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center gap-space-md min-w-0">
<div className="p-space-xs rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[24px]">description</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm font-semibold text-primary-container tracking-tight truncate">Monthly Financial Statement &amp; Audit Report</span>
<span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">Production Build</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Server-side headless export environment • Paper: ISO A4 Portrait • Render Engine: v4.18</span>
</div>
</div>
{/*  Month Selector Engine  */}
<div className="flex items-center justify-between sm:justify-center gap-space-xs bg-surface-container-low p-1 rounded-xl">
<button aria-label="Previous Month" className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center" id="prevMonthBtn" type="button">
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<div className="flex items-center gap-space-xs px-3 py-1 bg-surface-container-lowest rounded-lg shadow-sm">
<span className="material-symbols-outlined text-secondary text-[16px]">calendar_month</span>
<span className="font-label-md text-label-md font-semibold text-primary-container" id="selectedMonthDisplay">October 2024</span>
</div>
<button aria-label="Next Month" className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center" id="nextMonthBtn" type="button">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
{/*  Export Action Triggers  */}
<div className="flex items-center gap-space-sm flex-wrap sm:flex-nowrap">
<button className="flex-1 sm:flex-initial flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md font-semibold transition-colors" id="csvExportBtn" type="button">
<span className="material-symbols-outlined text-[18px]">table_view</span>
<span>Export Raw CSV</span>
</button>
<button className="flex-1 sm:flex-initial flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold shadow-sm transition-all" id="pdfExportBtn" type="button">
<span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
<span>Export as PDF (Executive Report)</span>
</button>
</div>
</div>
{/*  Notification Banner (Headless Trigger Feedback)  */}
<div className="hidden flex items-center justify-between px-space-md py-space-sm rounded-lg bg-surface-container-high text-primary-container text-body-sm font-body-sm shadow-sm" id="exportStatusBadge">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-secondary animate-spin text-[18px]">sync</span>
<span>Generating high-fidelity PDF buffer with cryptographic ledger watermark...</span>
</div>
<span className="font-numeric-sm text-numeric-sm font-semibold uppercase text-secondary">In Flight</span>
</div>
{/*  Executive Document Paper Layout (Built for PDF Page Consistency)  */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-6 sm:p-10 lg:p-12 flex flex-col gap-space-xl transition-all" id="printableDocument">
{/*  Document Masthead & Verification Seal  */}
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md pb-space-lg bg-surface-container-lowest">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<img alt="FinTrack Logo" className="h-9 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/>
<div className="h-6 w-1 bg-secondary rounded-full"></div>
<span className="font-headline-md text-headline-md font-bold tracking-tight text-primary-container uppercase">Executive Statement</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant tracking-wide uppercase">Institutional Wealth Management • Personal Ledger Registry Division</p>
</div>
{/*  Metadata Box  */}
<div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md rounded-xl bg-surface-container-low">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Account Holder</span>
<span className="font-label-md text-label-md font-semibold text-on-surface">Arjun Patel</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">ID: #IND-9024</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Statement Period</span>
<span className="font-label-md text-label-md font-semibold text-on-surface">01 Oct – 31 Oct 2024</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">31 Days • Complete</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Generated At</span>
<span className="font-label-md text-label-md font-semibold text-on-surface">24 Oct 2024, 18:00</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">Standard IST (+05:30)</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Audit Status</span>
<div className="inline-flex items-center gap-1 text-secondary font-semibold font-label-md text-label-md">
<span className="material-symbols-outlined text-[16px]">verified</span>
<span>Certified Ledger</span>
</div>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">Reconciled 100%</span>
</div>
</div>
</div>
{/*  Visual Narrative & Overview Sparkline Section  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
{/*  High-Level Financial Pulse Card  */}
<div className="lg:col-span-8 p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md relative overflow-hidden">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Net Cash Flow Trajectory • Oct 2024</span>
<span className="font-headline-sm text-headline-sm font-semibold text-primary-container">Surplus Capital Allocation: ₹70,719.50</span>
</div>
<span className="px-space-sm py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold tracking-wide uppercase">56.5% Savings Ratio</span>
</div>
{/*  Inline SVG Trend Chart (30-day cumulative net position)  */}
<div className="w-full h-36 flex items-end">
<svg className="w-full h-full text-secondary" fill="none" preserveaspectratio="none" viewBox="0 0 700 120">
<defs>
<lineargradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stop-color="#006c4a" stop-opacity="0.25"></stop>
<stop offset="100%" stop-color="#006c4a" stop-opacity="0.0"></stop>
</lineargradient>
</defs>
<path d="M 0 100 Q 80 85, 140 90 T 280 65 T 420 50 T 560 30 T 700 15 L 700 120 L 0 120 Z" fill="url(#chartGradient)"></path>
<path d="M 0 100 Q 80 85, 140 90 T 280 65 T 420 50 T 560 30 T 700 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
{/*  Data Point Marks  */}
<circle cx="140" cy="90" fill="#006c4a" r="3.5"></circle>
<circle cx="280" cy="65" fill="#006c4a" r="3.5"></circle>
<circle cx="420" cy="50" fill="#006c4a" r="3.5"></circle>
<circle cx="560" cy="30" fill="#006c4a" r="3.5"></circle>
<circle cx="700" cy="15" fill="#0b1f3a" r="4.5"></circle>
</svg>
</div>
<div className="flex items-center justify-between font-numeric-sm text-numeric-sm text-on-surface-variant pt-space-xs">
<span>Day 01 (Salary Credit: +₹1,25,000)</span>
<span>Mid-Month Checkpoint (₹84,200)</span>
<span>Day 31 Target Surplus: ₹70,719.50</span>
</div>
</div>
{/*  Financial Health Ratio Dial Card  */}
<div className="lg:col-span-4 p-space-lg rounded-xl bg-surface-container-high flex flex-col justify-between gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Health Score</span>
<span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
</div>
<div className="flex items-center gap-space-md my-auto">
{/*  Circular Score Ring  */}
<div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
<svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="92, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-numeric-md text-numeric-md font-bold text-primary-container">92</span>
<span className="font-label-sm text-[8px] uppercase tracking-tighter text-outline">/100</span>
</div>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md font-bold text-secondary uppercase tracking-wider">A+ Institutional Rating</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">Discretionary burn dropped by 11.2%. Reserve accumulation exceeds targets.</p>
</div>
</div>
<div className="p-2 rounded-lg bg-surface-container-lowest flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface-variant">Recommended Reserve:</span>
<span className="font-semibold text-primary-container">6.2 Months Runway</span>
</div>
</div>
</div>
{/*  Executive Financial Summary Cards (Tabular Printable Matrix)  */}
<div className="flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Consolidated Executive Ledger Matrix</span>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
{/*  Metric 1  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Gross Inflow</span>
<span className="material-symbols-outlined text-secondary text-[20px]">arrow_downward</span>
</div>
<div className="mt-space-sm flex flex-col">
<span className="font-display-lg text-display-lg font-bold text-primary-container leading-tight">₹1,25,000<span className="text-headline-sm font-normal text-on-surface-variant">.00</span></span>
<span className="font-body-sm text-body-sm text-secondary font-medium mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check_circle</span> 100% Verified Salary Deposit
            </span>
</div>
</div>
{/*  Metric 2  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Total Expenditure</span>
<span className="material-symbols-outlined text-outline text-[20px]">arrow_upward</span>
</div>
<div className="mt-space-sm flex flex-col">
<span className="font-display-lg text-display-lg font-bold text-on-surface leading-tight">₹54,280<span className="text-headline-sm font-normal text-on-surface-variant">.50</span></span>
<span className="font-body-sm text-body-sm text-secondary font-medium mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">trending_down</span> -₹6,819.50 vs Prev Month
            </span>
</div>
</div>
{/*  Metric 3  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Net Savings Surplus</span>
<span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
</div>
<div className="mt-space-sm flex flex-col">
<span className="font-display-lg text-display-lg font-bold text-secondary leading-tight">₹70,719<span className="text-headline-sm font-normal text-on-surface-variant">.50</span></span>
<div className="flex items-center justify-between mt-1">
<span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Effective Savings Rate:</span>
<span className="font-numeric-sm text-numeric-sm font-bold text-secondary">56.5%</span>
</div>
</div>
</div>
{/*  Metric 4  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Budget Cap Compliance</span>
<span className="material-symbols-outlined text-error text-[20px]">crisis_alert</span>
</div>
<div className="mt-space-sm flex flex-col">
<span className="font-display-lg text-display-lg font-bold text-primary-container leading-tight">1 <span className="text-headline-sm font-normal text-on-surface-variant">of 5 Over</span></span>
<span className="font-body-sm text-body-sm text-error font-medium mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">warning</span> Entertainment: +₹100.00
            </span>
</div>
</div>
</div>
</div>
{/*  Month-over-Month Comparative Table (Audit Grade)  */}
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
<span className="font-headline-sm text-headline-sm font-semibold text-primary-container">Month-over-Month Expenditure Variance</span>
</div>
<div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
<span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> Reduction</span>
<span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error"></span> Threshold Exceeded</span>
</div>
</div>
{/*  Ledger Table  */}
<div className="overflow-x-auto rounded-xl bg-surface-container-low shadow-sm">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<th className="py-3 px-4 font-semibold" scope="col">Ledger Category</th>
<th className="py-3 px-4 text-right font-semibold" scope="col">September 2024</th>
<th className="py-3 px-4 text-right font-semibold" scope="col">October 2024</th>
<th className="py-3 px-4 text-right font-semibold" scope="col">Variance (₹)</th>
<th className="py-3 px-4 text-right font-semibold" scope="col">% Variance</th>
<th className="py-3 px-4 text-center font-semibold" scope="col">Status / Tag</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
{/*  Row 1  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">home</span>
<span>Housing</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹22,000.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹22,000.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-on-surface-variant">₹0.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-on-surface-variant">0.0%</td>
<td className="py-3 px-4 text-center">
<span className="inline-block px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase">Constant</span>
</td>
</tr>
{/*  Row 2  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">shopping_cart</span>
<span>Groceries</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹10,150.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹9,800.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-₹350.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-3.4%</td>
<td className="py-3 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">
<span className="material-symbols-outlined text-[12px]">trending_down</span> Improved
                </span>
</td>
</tr>
{/*  Row 3  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">restaurant</span>
<span>Dining &amp; Food</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹6,800.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹6,450.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-₹350.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-5.1%</td>
<td className="py-3 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">
<span className="material-symbols-outlined text-[12px]">trending_down</span> Improved
                </span>
</td>
</tr>
{/*  Row 4  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">bolt</span>
<span>Utilities</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹4,400.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹4,640.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-on-surface font-semibold">+₹240.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-on-surface font-semibold">+5.5%</td>
<td className="py-3 px-4 text-center">
<span className="inline-block px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase">Within Cap</span>
</td>
</tr>
{/*  Row 5  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">movie</span>
<span>Entertainment</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹2,800.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹3,100.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-error font-bold">+₹300.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-error font-bold">+10.7%</td>
<td className="py-3 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm uppercase font-semibold">
<span className="material-symbols-outlined text-[12px]">priority_high</span> Over Limit
                </span>
</td>
</tr>
{/*  Row 6  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">directions_car</span>
<span>Transportation</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹3,450.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹3,200.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-₹250.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-semibold">-7.2%</td>
<td className="py-3 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">
<span className="material-symbols-outlined text-[12px]">trending_down</span> Reduced
                </span>
</td>
</tr>
{/*  Row 7  */}
<tr className="hover:bg-surface-container-lowest transition-colors">
<td className="py-3 px-4 font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">local_mall</span>
<span>Shopping</span>
</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md">₹11,500.00</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md font-semibold text-primary-container">₹4,590.50</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-bold">-₹6,909.50</td>
<td className="py-3 px-4 text-right font-numeric-md text-numeric-md text-secondary font-bold">-60.1%</td>
<td className="py-3 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-semibold">
<span className="material-symbols-outlined text-[12px]">trending_down</span> Major Saver
                </span>
</td>
</tr>
{/*  Grand Total Aggregation Row  */}
<tr className="bg-surface-container-high font-semibold text-primary-container">
<td className="py-3.5 px-4 font-headline-sm text-headline-sm">Grand Total Expenditure</td>
<td className="py-3.5 px-4 text-right font-numeric-lg text-numeric-lg text-on-surface-variant">₹61,100.00</td>
<td className="py-3.5 px-4 text-right font-numeric-lg text-numeric-lg text-primary-container">₹54,280.50</td>
<td className="py-3.5 px-4 text-right font-numeric-lg text-numeric-lg text-secondary">-₹6,819.50</td>
<td className="py-3.5 px-4 text-right font-numeric-lg text-numeric-lg text-secondary">-11.2%</td>
<td className="py-3.5 px-4 text-center">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase">Overall Spend Cut</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
{/*  Supplementary Budget Distribution Insights  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Fixed Commitments</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-on-surface">₹26,640.00</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Housing &amp; Utilities aggregate to 49.1% of total monthly outflow.</p>
</div>
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Discretionary Spend</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-on-surface">₹27,640.50</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Food, Retail, &amp; Leisure decreased significantly by ₹7,059.50 MoM.</p>
</div>
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Projected Emergency Reserve</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-secondary">₹4,24,317.00</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Sufficient liquid cover for 7.8 months of baseline fixed overhead.</p>
</div>
</div>
{/*  Sign-off & Institutional Cryptographic Verification Block  */}
<div className="mt-space-md pt-space-lg flex flex-col gap-space-md bg-surface-container-lowest">
<div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-space-lg">
{/*  Signatures & Authority  */}
<div className="flex items-center gap-space-xl">
<div className="flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Account Holder Attestation</span>
<div className="h-10 flex items-end">
<span className="font-headline-sm text-headline-sm italic text-primary-container font-serif">Arjun Patel</span>
</div>
<div className="w-48 h-0.5 bg-surface-variant"></div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Arjun Patel (Primary Ledger Owner)</span>
</div>
<div className="flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">System Validation Authority</span>
<div className="h-10 flex items-center gap-1.5 text-secondary">
<span className="material-symbols-outlined text-[24px]">verified_user</span>
<span className="font-headline-sm text-headline-sm font-semibold tracking-tight">FinTrack Core Engine</span>
</div>
<div className="w-48 h-0.5 bg-surface-variant"></div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Algorithmic Ledger Auditor v2.4</span>
</div>
</div>
{/*  Security Micro QR / Hash Marker  */}
<div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-high">
{/*  Minimal Pure CSS Barcode Representation  */}
<div className="flex items-center gap-0.5 h-10 px-1 bg-surface-container-lowest rounded">
<div className="w-0.5 h-8 bg-primary"></div>
<div className="w-1 h-8 bg-primary"></div>
<div className="w-0.5 h-8 bg-primary"></div>
<div className="w-1.5 h-8 bg-primary"></div>
<div className="w-0.5 h-8 bg-primary"></div>
<div className="w-2 h-8 bg-primary"></div>
<div className="w-0.5 h-8 bg-primary"></div>
<div className="w-1 h-8 bg-primary"></div>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm font-bold text-primary-container">BLOCK-STAMP #OCT-2024-C9</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">SHA-256: e83b...40f1a</span>
</div>
</div>
</div>
{/*  Database Audit & Integrity Stamp Banner  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-sm">
<span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">terminal</span>
<div className="flex flex-col gap-0.5 font-numeric-sm text-numeric-sm text-on-surface leading-relaxed">
<span className="font-semibold text-primary-container font-label-sm text-label-sm uppercase tracking-wider">Database Audit Trail Confirmation</span>
<span>Verified against MySQL audit log hash <code className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-primary font-bold">#9f82a1c</code>. Stored procedure executed: <code className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-primary">sp_generate_monthly_summary(user_id=1, month="2024-10")</code>.</span>
<span className="text-secondary font-medium">Status: Zero orphan records discovered. Consistency check passed in 14.8ms. Ledger certified immutable for statement cycle.</span>
</div>
</div>
</div>
</div>
</div>
</main></div>
    </>
  );
}
