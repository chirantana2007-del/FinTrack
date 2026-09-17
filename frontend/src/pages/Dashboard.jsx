import React from 'react';

export default function Dashboard() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full gap-space-lg">
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md pb-space-xs">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider">
<span>Portfolio Analytics</span>
<span>•</span>
<span>Consolidated Ledger</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mt-0.5">Financial Overview</h1>
<p className="font-body-sm text-body-sm text-on-surface-variant">Thursday, 24 October 2024 <span className="text-outline">· Real-time transaction reconciliation</span></p>
</div>
<div className="flex items-center gap-space-sm self-start sm:self-auto">
<div className="relative inline-block">
<button className="flex items-center gap-space-xs px-space-md py-1.5 bg-surface-container-lowest text-on-surface rounded-lg shadow-sm hover:bg-surface-container-low transition-colors" id="periodSelectorBtn" type="button">
<span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
<span className="font-label-md text-label-md font-semibold text-primary-container">October 2024</span>
<span className="material-symbols-outlined text-outline text-[18px]">expand_more</span>
</button>
</div>
<button className="flex items-center gap-space-xs px-space-md py-1.5 bg-primary-container text-on-primary rounded-lg shadow-sm hover:bg-on-primary-fixed-variant transition-colors" id="refreshBtn"  title="Execute sp_generate_monthly_summary" type="button">
<span className="material-symbols-outlined text-[18px] transition-transform" id="refreshIcon">sync</span>
<span className="font-label-md text-label-md font-semibold">Refresh Summary</span>
</button>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop">
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex items-start justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Total Outflow</span>
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[18px]">trending_down</span>
</div>
</div>
<div className="mt-space-sm">
<div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">₹54,280</div>
<div className="flex items-center gap-space-xs mt-1">
<span className="flex items-center text-secondary font-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            8.4%
          </span>
<span className="font-body-sm text-body-sm text-outline">vs last month (spend drop)</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex items-start justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Net Inflow</span>
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
</div>
</div>
<div className="mt-space-sm">
<div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">₹1,25,000</div>
<div className="flex items-center gap-space-xs mt-1">
<span className="px-1.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm font-semibold text-[10px] tracking-wider uppercase">Steady</span>
<span className="font-body-sm text-body-sm text-outline">Corporate Salary · Credited 01 Oct</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex items-start justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Budget Adherence</span>
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-tertiary-container">
<span className="material-symbols-outlined text-[18px]">pie_chart</span>
</div>
</div>
<div className="mt-space-sm">
<div className="flex items-baseline gap-space-xs">
<span className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">68%</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">of ₹80,000 limit</span>
</div>
<div className="flex items-center gap-space-xs mt-1">
<span className="font-label-sm text-label-sm font-semibold text-secondary">₹25,720 remaining</span>
<span className="font-body-sm text-body-sm text-outline">· 7 days left</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex items-start justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Subscriptions</span>
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[18px]">autorenew</span>
</div>
</div>
<div className="mt-space-sm">
<div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">6 Tracked</div>
<div className="flex items-center gap-space-xs mt-1 truncate">
<span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Netflix (₹649)</span>
<span className="font-label-sm text-label-sm text-outline flex-shrink-0">due 28 Oct</span>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
<div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between pb-space-sm">
<div>
<h2 className="font-headline-sm text-headline-sm text-primary-container">Category Spending Breakdown</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Aggregated aggregate expenditure across classified ledger tags</p>
</div>
<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-semibold">sp_cat_alloc</span>
</div>
<div className="flex flex-col md:flex-row items-center gap-space-lg my-space-md">
<div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
<circle cx="50" cy="50" fill="none" r="38" stroke="#e5eeff" strokeWidth="12"></circle>
{/*  Housing: 40.5% -> 40.5 * 2.3876 = 96.7  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#0b1f3a" stroke-dasharray="96.7 238.76" stroke-dashoffset="0" strokeWidth="12"></circle>
{/*  Groceries: 18.1% -> 43.2  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#006c4a" stroke-dasharray="43.2 238.76" stroke-dashoffset="-96.7" strokeWidth="12"></circle>
{/*  Dining: 11.9% -> 28.4  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#ac8000" stroke-dasharray="28.4 238.76" stroke-dashoffset="-139.9" strokeWidth="12"></circle>
{/*  Utilities: 8.5% -> 20.3  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#4d5f7d" stroke-dasharray="20.3 238.76" stroke-dashoffset="-168.3" strokeWidth="12"></circle>
{/*  Transport: 5.9% -> 14.1  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#7587a7" stroke-dasharray="14.1 238.76" stroke-dashoffset="-188.6" strokeWidth="12"></circle>
{/*  Others: 15.1% -> 36.05  */}
<circle cx="50" cy="50" fill="none" r="38" stroke="#c4c6ce" stroke-dasharray="36.05 238.76" stroke-dashoffset="-202.7" strokeWidth="12"></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
<span className="font-numeric-sm text-numeric-sm text-outline uppercase font-semibold">Total</span>
<span className="font-headline-sm text-headline-sm font-bold text-primary-container leading-none">₹54,280</span>
</div>
</div>
<div className="grid grid-cols-2 gap-x-space-md gap-y-space-xs w-full">
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-primary-container flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Housing</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹22,000</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">40.5%</span>
</div>
</div>
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-secondary flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Groceries</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹9,800</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">18.1%</span>
</div>
</div>
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-on-tertiary-container flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Dining</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹6,450</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">11.9%</span>
</div>
</div>
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-surface-tint flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Utilities</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹4,640</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">8.5%</span>
</div>
</div>
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-on-primary-container flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Transport</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹3,200</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">5.9%</span>
</div>
</div>
<div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs truncate">
<span className="w-2.5 h-2.5 rounded-sm bg-outline-variant flex-shrink-0"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Others</span>
</div>
<div className="text-right flex-shrink-0 pl-space-xs">
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹8,190</span>
<span className="font-label-sm text-label-sm text-outline block text-[10px]">15.1%</span>
</div>
</div>
</div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between mt-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
<span className="font-body-sm text-body-sm text-on-surface">100% of recorded transactions passed categorization audit rules.</span>
</div>
<a className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline" href="#">Full Analytics →</a>
</div>
</div>
<div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between pb-space-sm">
<div>
<h2 className="font-headline-sm text-headline-sm text-primary-container">Active Category Budgets</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Threshold tracking against assigned envelope ceilings</p>
</div>
<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-outline font-semibold">5 Active</span>
</div>
<div className="flex flex-col gap-space-md mt-space-sm">
<div className="flex flex-col gap-1">
<div className="flex justify-between items-baseline font-body-sm">
<span className="font-medium text-on-surface">Groceries</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface">₹9,800 <span className="text-outline">/ ₹12,000</span> <span className="font-semibold text-secondary ml-1">(81.6%)</span></span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{ width: "81.6%" }}></div>
</div>
</div>
<div className="flex flex-col gap-1">
<div className="flex justify-between items-baseline font-body-sm">
<div className="flex items-center gap-1">
<span className="font-medium text-on-surface">Dining Out</span>
<span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-semibold uppercase tracking-wider">Near Limit</span>
</div>
<span className="font-numeric-sm text-numeric-sm text-on-surface">₹6,450 <span className="text-outline">/ ₹7,000</span> <span className="font-semibold text-on-tertiary-container ml-1">(92.1%)</span></span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-tertiary-fixed-dim rounded-full" style={{ width: "92.1%" }}></div>
</div>
</div>
<div className="flex flex-col gap-1">
<div className="flex justify-between items-baseline font-body-sm">
<span className="font-medium text-on-surface">Utilities</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface">₹4,640 <span className="text-outline">/ ₹5,500</span> <span className="font-semibold text-secondary ml-1">(84.3%)</span></span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{ width: "84.3%" }}></div>
</div>
</div>
<div className="flex flex-col gap-1">
<div className="flex justify-between items-baseline font-body-sm">
<span className="font-medium text-on-surface">Transportation</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface">₹3,200 <span className="text-outline">/ ₹5,000</span> <span className="font-semibold text-secondary ml-1">(64.0%)</span></span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{ width: "64%" }}></div>
</div>
</div>
<div className="p-space-xs rounded-lg bg-error-container/40 flex flex-col gap-1">
<div className="flex justify-between items-baseline font-body-sm">
<div className="flex items-center gap-1">
<span className="font-semibold text-on-surface">Entertainment</span>
<span className="material-symbols-outlined text-error text-[16px]">warning</span>
</div>
<span className="font-numeric-sm text-numeric-sm font-bold text-error">₹3,100 <span className="text-on-surface-variant font-normal">/ ₹3,000</span> (103.3%)</span>
</div>
<div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-error rounded-full" style={{ width: "100%" }}></div>
</div>
<span className="font-label-sm text-label-sm font-semibold text-error">₹100 Over budget · Triggered Alert #41</span>
</div>
</div>
</div>
<div className="pt-space-sm flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline">Adjust thresholds via budget manager</span>
<button className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline">Reallocate Envelopes</button>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
<div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm">
<div>
<h2 className="font-headline-sm text-headline-sm text-primary-container">Recent Transactions</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Real-time debit &amp; credit ledger entries</p>
</div>
<a className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline flex items-center gap-0.5" href="#">
          View All Ledger
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</a>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-low text-outline font-label-sm uppercase tracking-wider">
<th className="py-2.5 px-3.5 rounded-l-lg">Entity / Payee</th>
<th className="py-2.5 px-3.5">Category</th>
<th className="py-2.5 px-3.5">Timestamp</th>
<th className="py-2.5 px-3.5">Rule / Origin</th>
<th className="py-2.5 px-3.5 text-right rounded-r-lg">Amount</th>
</tr>
</thead>
<tbody className="divide-y-0">
<tr className="hover:bg-surface-container-low/70 transition-colors">
<td className="py-2.5 px-3.5 flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-[12px] text-primary-container">S</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">Swiggy Delivery</span>
<span className="font-label-sm text-label-sm text-outline">UPI · HDFC Bank</span>
</div>
</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface">Dining</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant">Today, 13:42</td>
<td className="py-2.5 px-3.5">
<span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] font-semibold tracking-wider uppercase">Auto Rule #12</span>
</td>
<td className="py-2.5 px-3.5 font-numeric-md text-numeric-md font-semibold text-right text-on-surface">-₹460.00</td>
</tr>
<tr className="hover:bg-surface-container-low/70 transition-colors">
<td className="py-2.5 px-3.5 flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-[12px] text-primary-container">Z</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">Zepto Quick Commerce</span>
<span className="font-label-sm text-label-sm text-outline">Card · ICICI 9042</span>
</div>
</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface">Groceries</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant">Yesterday, 19:15</td>
<td className="py-2.5 px-3.5">
<span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-semibold tracking-wider uppercase">Heuristic AI</span>
</td>
<td className="py-2.5 px-3.5 font-numeric-md text-numeric-md font-semibold text-right text-on-surface">-₹1,120.50</td>
</tr>
<tr className="hover:bg-surface-container-low/70 transition-colors">
<td className="py-2.5 px-3.5 flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center font-bold text-[12px] text-secondary">I</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">Infosys Payroll</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">NEFT Monthly Payout</span>
</div>
</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-secondary font-medium">Income</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant">01 Oct, 09:00</td>
<td className="py-2.5 px-3.5">
<span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-semibold tracking-wider uppercase">Fixed Salary</span>
</td>
<td className="py-2.5 px-3.5 font-numeric-md text-numeric-md font-bold text-right text-secondary">+₹1,25,000.00</td>
</tr>
<tr className="hover:bg-surface-container-low/70 transition-colors">
<td className="py-2.5 px-3.5 flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-[12px] text-primary-container">U</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">Uber India Rides</span>
<span className="font-label-sm text-label-sm text-outline">UPI · HDFC Bank</span>
</div>
</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface">Transport</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant">22 Oct, 08:24</td>
<td className="py-2.5 px-3.5">
<span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] font-semibold tracking-wider uppercase">Auto Rule #04</span>
</td>
<td className="py-2.5 px-3.5 font-numeric-md text-numeric-md font-semibold text-right text-on-surface">-₹340.00</td>
</tr>
<tr className="hover:bg-surface-container-low/70 transition-colors">
<td className="py-2.5 px-3.5 flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-[12px] text-primary-container">A</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">Amazon Web Services</span>
<span className="font-label-sm text-label-sm text-outline">Recurring Card Auth</span>
</div>
</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface">Utilities / Dev</td>
<td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant">20 Oct, 02:11</td>
<td className="py-2.5 px-3.5">
<span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] font-semibold tracking-wider uppercase">Recurring Sub</span>
</td>
<td className="py-2.5 px-3.5 font-numeric-md text-numeric-md font-semibold text-right text-on-surface">-₹1,850.20</td>
</tr>
</tbody>
</table>
</div>
</div>
<div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between pb-space-sm">
<div>
<h2 className="font-headline-sm text-headline-sm text-primary-container">Cash Flow Trajectory</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Quarterly monthly outflow compression</p>
</div>
<span className="material-symbols-outlined text-outline text-[20px]">ssid_chart</span>
</div>
<div className="flex flex-col gap-space-md mt-space-sm">
<div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">
<div className="w-12 text-center">
<span className="font-label-sm text-label-sm font-semibold uppercase text-outline block">Aug</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-medium">2024</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-baseline mb-1">
<span className="font-numeric-md text-numeric-md font-bold text-on-surface">₹58,400</span>
<span className="font-label-sm text-label-sm text-outline">Baseline</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-outline rounded-full" style={{ width: "73%" }}></div>
</div>
</div>
</div>
<div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">
<div className="w-12 text-center">
<span className="font-label-sm text-label-sm font-semibold uppercase text-outline block">Sep</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-medium">2024</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-baseline mb-1">
<span className="font-numeric-md text-numeric-md font-bold text-on-surface">₹61,200</span>
<span className="font-label-sm text-label-sm text-error font-medium">+4.8% peak</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{ width: "76.5%" }}></div>
</div>
</div>
</div>
<div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-high">
<div className="w-12 text-center">
<span className="font-label-sm text-label-sm font-bold uppercase text-primary-container block">Oct</span>
<span className="font-numeric-sm text-numeric-sm text-secondary font-bold">Active</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-baseline mb-1">
<span className="font-numeric-md text-numeric-md font-bold text-secondary">₹54,280</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">-11.3% vs Sep</span>
</div>
<div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{ width: "67.8%" }}></div>
</div>
</div>
</div>
</div>
</div>
<div className="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center gap-space-xs text-primary-container font-label-md font-semibold">
<span className="material-symbols-outlined text-[16px]">insights</span>
<span>Proactive Estimate</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Projected month-end closing outflow stands at <strong>₹59,850</strong>, comfortably below the ₹80,000 safety envelope.</p>
</div>
</div>
</div>
</div>
</main></div>
    </>
  );
}
