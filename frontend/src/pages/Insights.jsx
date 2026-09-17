import React from 'react';

export default function Insights() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full">
{/*  Sub-Header / Context Meta Strip  */}
<div className="flex flex-col md:flex-row md:items-end justify-between pb-space-lg gap-space-sm">
<div className="flex flex-col">
<h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mt-0.5">AI Insights</h1>
<p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Ask questions about your spending and see forecasts for next month.</p>
</div>
</div>
{/*  SECTION 1: Natural Language Structured Query Engine  */}
<section className="flex flex-col gap-space-md mb-space-xl">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-2 h-2 rounded-full bg-primary-container"></div>
<h2 className="font-headline-md text-headline-md text-primary-container">Ask FinTrack</h2>
</div>
</div>
{/*  Main Query Terminal Card  */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
{/*  Input Box (Structured Search Command, Not a Chatbot)  */}
<div className="flex flex-col gap-space-xs">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold" htmlFor="nl-query-input">What do you want to know?</label>
<div className="relative flex items-center">
<span className="absolute left-space-md material-symbols-outlined text-outline text-[20px]">search</span>
<input className="w-full bg-surface-container-low pl-11 pr-32 py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-outline" id="nl-query-input" placeholder="Ask a question..." type="text" defaultValue="How much did I spend on Dining in October 2024?"/>
<div className="absolute right-2 flex items-center gap-1">
<button className="px-space-xs py-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm" id="btn-clear-query" type="button">Clear</button>
<button className="px-space-md py-1.5 rounded-lg bg-primary-container hover:bg-inverse-surface text-on-primary font-label-md text-label-md flex items-center gap-1 transition-colors" id="btn-run-query" type="button">
<span>Execute</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</div>
</div>
{/*  Clickable Pre-Compiled Query Chips  */}
<div className="flex flex-col sm:flex-row sm:items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-outline font-medium shrink-0">Sample Templates:</span>
<div className="flex flex-wrap gap-space-xs" id="template-chips">
<button className="template-chip px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-left flex items-center gap-1" data-query="How much did I spend on Dining in October 2024?" type="button">
<span className="material-symbols-outlined text-outline text-[14px]">query_builder</span>
<span>Dining in Oct 2024</span>
</button>
<button className="template-chip px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-left flex items-center gap-1" data-query="What was my highest expense this month?" type="button">
<span className="material-symbols-outlined text-outline text-[14px]">expand</span>
<span>Highest expense this month</span>
</button>
<button className="template-chip px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-left flex items-center gap-1" data-query="Compare Groceries spending between Sep and Oct" type="button">
<span className="material-symbols-outlined text-outline text-[14px]">compare_arrows</span>
<span>Groceries: Sep vs Oct</span>
</button>
<button className="template-chip px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-left flex items-center gap-1" data-query="List upcoming recurring subscriptions" type="button">
<span className="material-symbols-outlined text-outline text-[14px]">sync</span>
<span>Upcoming subscriptions</span>
</button>
</div>
</div>
{/*  Result Card Directly Beneath  */}
<div className="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-sm mt-space-xs transition-opacity duration-200" id="query-result-block">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-highest text-primary-container font-label-sm text-label-sm font-semibold uppercase">Searching For</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">category = <strong className="text-on-surface font-semibold">"Dining &amp; Food"</strong>, month = <strong className="text-on-surface font-semibold">"2024-10"</strong></span>
</div>
<div className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-[16px] text-secondary">database</span>
<span className="font-numeric-sm text-numeric-sm">Execution runtime: <strong>3.2ms</strong></span>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center py-space-xs">
{/*  Primary Metric  */}
<div className="lg:col-span-5 flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Total Amount</span>
<div className="flex items-baseline gap-space-xs mt-0.5">
<span className="font-headline-lg text-headline-lg text-primary-container font-semibold">₹6,450.00</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">across 14 transactions</span>
</div>
<div className="w-full bg-surface-variant rounded-full h-1.5 mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{ width: "11.9%" }}></div>
</div>
</div>
{/*  Quantitative Context Narrative  */}
<div className="lg:col-span-7 flex flex-col bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
<div className="flex items-center gap-1 text-on-surface font-label-md text-label-md font-medium mb-1">
<span className="material-symbols-outlined text-[18px] text-primary-container">info</span>
<span>What this means</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Represents <strong className="text-on-surface font-semibold">11.9%</strong> of your total spend this month (₹54,200 baseline). <strong className="text-on-surface font-semibold">3 transactions</strong> exceeded the typical ₹500 threshold, with the maximum observed at Social Taproom (₹1,480.00 on 14 Oct).
            </p>
</div>
</div>
{/*  Academic Evaluator Footprint / SQL Badge  */}
<div className="pt-space-xs flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
<div className="flex items-start sm:items-center gap-space-xs">
<span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 sm:mt-0">code</span>
<code className="font-numeric-sm text-numeric-sm text-on-surface-variant bg-surface-container-highest px-space-xs py-0.5 rounded-lg break-all">
              Template #03: SELECT SUM(amount), COUNT(*) FROM Transactions WHERE category_id = ? AND MONTH(transaction_date) = 10 AND YEAR(transaction_date) = 2024
            </code>
</div>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold shrink-0">Generated via SQL</span>
</div>
</div>
</div>
</section>
{/*  SECTION 2: Predictive Forecast Engine  */}
<section className="flex flex-col gap-space-md mb-space-xl">
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-xs">
<div>
<div className="flex items-center gap-space-sm">
<div className="w-2 h-2 rounded-full bg-secondary"></div>
<h2 className="font-headline-md text-headline-md text-primary-container">Next Month Spend Forecast</h2>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Based on your past 3 months of spending habits.</p>
</div>
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">For: Nov 2024</span>
</div>
{/*  3 Cards Bento Grid  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
{/*  Forecast Card 1: Groceries  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-start justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">shopping_cart</span>
<span className="font-headline-sm text-headline-sm text-primary-container">Groceries</span>
</div>
<span className="flex items-center gap-0.5 px-space-xs py-0.5 rounded-lg bg-surface-container-high text-error font-numeric-sm text-numeric-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
              +4.5%
            </span>
</div>
<div className="mt-space-md flex items-baseline gap-space-xs">
<span className="font-headline-lg text-headline-lg font-semibold text-primary-container">₹10,250</span>
<span className="font-label-sm text-label-sm text-outline uppercase font-semibold">est. projected</span>
</div>
{/*  Micro Sparkline SVG Chart (3 Months Trajectory)  */}
<div className="py-space-sm">
<div className="flex items-center justify-between text-on-surface-variant font-numeric-sm text-numeric-sm mb-1">
<span>Aug: ₹10.8k</span>
<span>Sep: ₹10.1k</span>
<span>Oct: ₹9.8k</span>
</div>
<svg className="w-full h-10 text-primary-container" fill="none" preserveaspectratio="none" viewBox="0 0 200 40">
<path d="M0,8 L70,18 L130,28 L200,16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vector-effect="non-scaling-stroke"></path>
<path d="M130,28 L200,16" stroke="currentColor" stroke-dasharray="3 3" strokeLinecap="round" strokeWidth="2"></path>
<circle cx="0" cy="8" fill="#0b1f3a" r="3"></circle>
<circle cx="70" cy="18" fill="#0b1f3a" r="3"></circle>
<circle cx="130" cy="28" fill="#0b1f3a" r="3"></circle>
<circle cx="200" cy="16" fill="#006c4a" r="3.5"></circle>
</svg>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            3-month weighted average (Aug: ₹10,800, Sep: ₹10,150, Oct: ₹9,800). Holiday festival purchases and pantry restocking anticipated for November cycle.
          </p>
</div>
<div className="mt-space-md pt-space-xs bg-surface-container-low p-space-xs rounded-lg flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline uppercase">Confidence Band</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-semibold">₹9,700 – ₹10,800</span>
</div>
</div>
{/*  Forecast Card 2: Dining Out  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-start justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">restaurant</span>
<span className="font-headline-sm text-headline-sm text-primary-container">Dining Out</span>
</div>
<span className="flex items-center gap-0.5 px-space-xs py-0.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant font-numeric-sm text-numeric-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">trending_down</span>
              -5.4%
            </span>
</div>
<div className="mt-space-md flex items-baseline gap-space-xs">
<span className="font-headline-lg text-headline-lg font-semibold text-primary-container">₹6,100</span>
<span className="font-label-sm text-label-sm text-outline uppercase font-semibold">est. projected</span>
</div>
{/*  Micro Sparkline SVG Chart  */}
<div className="py-space-sm">
<div className="flex items-center justify-between text-on-surface-variant font-numeric-sm text-numeric-sm mb-1">
<span>Aug: ₹5.9k</span>
<span>Sep: ₹7.2k</span>
<span>Oct: ₹6.4k</span>
</div>
<svg className="w-full h-10 text-secondary" fill="none" preserveaspectratio="none" viewBox="0 0 200 40">
<path d="M0,26 L70,6 L130,16 L200,22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vector-effect="non-scaling-stroke"></path>
<path d="M130,16 L200,22" stroke="currentColor" stroke-dasharray="3 3" strokeLinecap="round" strokeWidth="2"></path>
<circle cx="0" cy="26" fill="#006c4a" r="3"></circle>
<circle cx="70" cy="6" fill="#006c4a" r="3"></circle>
<circle cx="130" cy="16" fill="#006c4a" r="3"></circle>
<circle cx="200" cy="22" fill="#006c4a" r="3.5"></circle>
</svg>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            Based on 3-month rolling median. Spending normalized after late September peak social celebrations; delivery orders down 8% month-over-month.
          </p>
</div>
<div className="mt-space-md pt-space-xs bg-surface-container-low p-space-xs rounded-lg flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline uppercase">Confidence Band</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-semibold">₹5,750 – ₹6,450</span>
</div>
</div>
{/*  Forecast Card 3: Utilities  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-start justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">bolt</span>
<span className="font-headline-sm text-headline-sm text-primary-container">Utilities</span>
</div>
<span className="flex items-center gap-0.5 px-space-xs py-0.5 rounded-lg bg-surface-container-high text-error font-numeric-sm text-numeric-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
              +4.5%
            </span>
</div>
<div className="mt-space-md flex items-baseline gap-space-xs">
<span className="font-headline-lg text-headline-lg font-semibold text-primary-container">₹4,850</span>
<span className="font-label-sm text-label-sm text-outline uppercase font-semibold">est. projected</span>
</div>
{/*  Micro Sparkline SVG Chart  */}
<div className="py-space-sm">
<div className="flex items-center justify-between text-on-surface-variant font-numeric-sm text-numeric-sm mb-1">
<span>Aug: ₹4.2k</span>
<span>Sep: ₹4.5k</span>
<span>Oct: ₹4.6k</span>
</div>
<svg className="w-full h-10 text-primary-container" fill="none" preserveaspectratio="none" viewBox="0 0 200 40">
<path d="M0,30 L70,20 L130,16 L200,8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vector-effect="non-scaling-stroke"></path>
<path d="M130,16 L200,8" stroke="currentColor" stroke-dasharray="3 3" strokeLinecap="round" strokeWidth="2"></path>
<circle cx="0" cy="30" fill="#0b1f3a" r="3"></circle>
<circle cx="70" cy="20" fill="#0b1f3a" r="3"></circle>
<circle cx="130" cy="16" fill="#0b1f3a" r="3"></circle>
<circle cx="200" cy="8" fill="#0b1f3a" r="3.5"></circle>
</svg>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            Seasonal variation adjustment based on historical Q4 electricity tariffs, heating prep, and scheduled annual fiber broadband renewal cycles.
          </p>
</div>
<div className="mt-space-md pt-space-xs bg-surface-container-low p-space-xs rounded-lg flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline uppercase">Confidence Band</span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-semibold">₹4,600 – ₹5,100</span>
</div>
</div>
</div>
</section>
{/*  SECTION 3: Anomaly Detection & Outliers  */}
<section className="flex flex-col gap-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-2 h-2 rounded-full bg-error"></div>
<div>
<h2 className="font-headline-md text-headline-md text-primary-container">Unusual Transactions</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">We noticed a few transactions that look different from your usual spending.</p>
</div>
</div>
{/*  Calm Amber Badge  */}
<div className="flex items-center gap-1.5 px-space-md py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed self-start sm:self-auto shadow-sm">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container">warning</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">3 flagged items requiring review</span>
</div>
</div>
{/*  Outlier Items Ledger / Card Container  */}
<div className="flex flex-col gap-space-sm">
{/*  Item 1: Croma Electronics  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md" id="outlier-row-1">
<div className="flex items-start gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
<span className="material-symbols-outlined text-[22px]">devices</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface font-medium">Croma Electronics Store</span>
<span className="px-space-xs py-0.5 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold uppercase">High Spend</span>
<span className="font-numeric-sm text-numeric-sm text-outline">12 Oct 2024</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
<strong className="text-on-surface font-medium">310% higher</strong> than your average Shopping expense. Was this a one-off purchase?
            </p>
</div>
</div>
<div className="flex items-center justify-between lg:justify-end gap-space-lg shrink-0 pt-space-xs lg:pt-0">
<div className="flex flex-col text-right">
<span className="font-numeric-lg text-numeric-lg text-primary-container font-semibold">₹18,499.00</span>
<span className="font-label-sm text-label-sm text-outline">Merchant ID #8841</span>
</div>
<div className="flex items-center gap-1.5">
<button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"  type="button">
              Confirm Legit
            </button>
<button className="px-space-sm py-1.5 rounded-lg bg-primary-container hover:bg-inverse-surface text-on-primary font-label-md text-label-md transition-colors"  type="button">
              Exclude from Forecast
            </button>
</div>
</div>
</div>
{/*  Item 2: Urban Company  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md" id="outlier-row-2">
<div className="flex items-start gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
<span className="material-symbols-outlined text-[22px]">home_repair_service</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface font-medium">Urban Company Home Services</span>
<span className="px-space-xs py-0.5 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold uppercase">Unusual</span>
<span className="font-numeric-sm text-numeric-sm text-outline">08 Oct 2024</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
<strong className="text-on-surface font-medium">85% above</strong> your normal Services spending. We also noticed multiple bookings within 48 hours.
            </p>
</div>
</div>
<div className="flex items-center justify-between lg:justify-end gap-space-lg shrink-0 pt-space-xs lg:pt-0">
<div className="flex flex-col text-right">
<span className="font-numeric-lg text-numeric-lg text-primary-container font-semibold">₹4,200.00</span>
<span className="font-label-sm text-label-sm text-outline">UPI / Auto-debit</span>
</div>
<div className="flex items-center gap-1.5">
<button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"  type="button">
              Confirm Legit
            </button>
<button className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant font-label-md text-label-md transition-colors"  type="button">
              Review
            </button>
</div>
</div>
</div>
{/*  Item 3: Apple Services Recurring  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md" id="outlier-row-3">
<div className="flex items-start gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
<span className="material-symbols-outlined text-[22px]">autorenew</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface font-medium">Apple Services Recurring</span>
<span className="px-space-xs py-0.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold uppercase">Price Change</span>
<span className="font-numeric-sm text-numeric-sm text-outline">04 Oct 2024</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Amount changed from regular <strong className="text-on-surface font-medium">₹499.00</strong> monthly subscription. Detected tier upgrade or bundled Apple One family subscription.
            </p>
</div>
</div>
<div className="flex items-center justify-between lg:justify-end gap-space-lg shrink-0 pt-space-xs lg:pt-0">
<div className="flex flex-col text-right">
<span className="font-numeric-lg text-numeric-lg text-primary-container font-semibold">₹999.00</span>
<span className="font-label-sm text-label-sm text-outline">+100.2% Variance</span>
</div>
<div className="flex items-center gap-1.5">
<button className="px-space-sm py-1.5 rounded-lg bg-primary-container hover:bg-inverse-surface text-on-primary font-label-md text-label-md transition-colors"  type="button">
              Update Sub Plan
            </button>
<button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"  type="button">
              Dismiss
            </button>
</div>
</div>
</div>
</div>
</section>
</div>
</main></div>
    </>
  );
}
