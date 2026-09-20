import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const LIMIT = 10;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount) {
  const value = Number(amount);
  const sign = value < 0 ? '-' : '+';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError('');
      apiClient
        .get('/transactions', { params: { page, limit: LIMIT, search: search || undefined } })
        .then((response) => {
          setTransactions(response.data.transactions);
          setTotal(response.data.total);
        })
        .catch((err) => setError(err.response?.data?.message || 'Failed to load transactions'))
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(handle);
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full">
{/*  Ledger Operational Banner & Header Metrics  */}
<div className="flex flex-col gap-space-md mb-space-lg">
{/*  Top Editorial Header Bar  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs mb-1">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">Fiscal Ledger Node 04</span>
<span className="w-1 h-1 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Synced Live (UPI / IMPS / NEFT)</span>
</div>
<div className="flex items-baseline gap-space-sm flex-wrap">
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">Transaction Ledger</h1>
<span className="px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-numeric-sm text-numeric-sm font-semibold">Total {total.toLocaleString('en-IN')} Transactions</span>
</div>
</div>
{/*  Quick Action Utilities  */}
<div className="flex items-center gap-space-sm self-start md:self-auto">
<button className="flex items-center gap-space-xs px-3.5 py-1.5 rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low transition-all" id="exportBtn" type="button">
<span className="material-symbols-outlined text-[18px] text-primary-container">file_download</span>
<span className="font-label-md text-label-md font-semibold text-primary-container">Export CSV</span>
</button>
<button className="flex items-center gap-space-xs px-3.5 py-1.5 rounded bg-primary-container text-on-primary shadow-sm hover:bg-primary transition-all" id="manualEntryBtn" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="font-label-md text-label-md font-semibold">Add Manual Entry</span>
</button>
</div>
</div>
{/*  Micro Strip: Key Analytical Metrics & Daily Runway  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
<div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Period Inflow</span>
<span className="font-numeric-lg text-numeric-lg text-secondary font-semibold tracking-tight">+₹1,25,000.00</span>
</div>
<div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">south_west</span>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Period Outflow</span>
<span className="font-numeric-lg text-numeric-lg text-on-surface font-semibold tracking-tight">-₹54,280.50</span>
</div>
<div className="w-8 h-8 rounded bg-error-container text-on-error-container flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">north_east</span>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Net Operating Surplus</span>
<span className="font-numeric-lg text-numeric-lg text-primary-container font-semibold tracking-tight">+₹70,719.50</span>
</div>
<div className="w-8 h-8 rounded bg-surface-container text-on-primary-fixed-variant flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">account_balance</span>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Automated Audit Confidence</span>
<span className="font-numeric-lg text-numeric-lg text-on-surface font-semibold tracking-tight">98.4%</span>
</div>
<div className="w-8 h-8 rounded bg-surface-container-high text-secondary flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">verified_user</span>
</div>
</div>
</div>
</div>
{/*  Filter Toolbar (Data Precision Surface)  */}
<div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm mb-space-md">
<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm">
{/*  Search Input  */}
<div className="relative flex-1 min-w-[240px]">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
<input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="w-full pl-9 pr-4 py-2 text-on-surface font-body-md text-body-md rounded bg-surface-container-low focus:bg-surface-container-lowest transition-colors placeholder:text-outline focus:outline-none" id="tableSearch" placeholder="Search merchant, description, UTR or reference ID..." type="text"/>
</div>
{/*  Dense Filter Selectors  */}
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-space-xs">
{/*  Date Range  */}
<div className="relative">
<select className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option>Oct 1 - Oct 31, 2024</option>
<option>Previous Month (Sep 2024)</option>
<option>Q3 2024 (Jul - Sep)</option>
<option>Fiscal Year 2024-25</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">expand_more</span>
</div>
{/*  Category  */}
<div className="relative">
<select className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option>All Categories</option>
<option>Dining &amp; Food</option>
<option>Groceries</option>
<option>Income / Salary</option>
<option>Transportation</option>
<option>Subscriptions</option>
<option>Fitness &amp; Health</option>
<option>Utilities</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">filter_list</span>
</div>
{/*  Account  */}
<div className="relative">
<select className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option>All Accounts</option>
<option>HDFC Bank ••4091</option>
<option>ICICI Bank ••1822</option>
<option>SBI Savings ••9904</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">account_balance_wallet</span>
</div>
{/*  Engine / Categorization Source  */}
<div className="relative">
<select className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option>All Match Methods</option>
<option>Rule-matched (Deterministic)</option>
<option>AI-assisted (Heuristic / ML)</option>
<option>Manual User Categorized</option>
<option>Requires Review</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">neurology</span>
</div>
{/*  Amount Range Quick Pill  */}
<div className="relative col-span-2 sm:col-span-1">
<select className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option>₹0 - ₹1,00,000+</option>
<option>&lt; ₹1,000</option>
<option>₹1,000 - ₹10,000</option>
<option>&gt; ₹50,000</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">payments</span>
</div>
</div>
</div>
{/*  Active Filter Chips strip  */}
<div className="flex items-center gap-space-xs mt-space-sm pt-space-xs text-on-surface-variant flex-wrap">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Constraints:</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
        Date: Oct 2024
        <button className="hover:text-error ml-0.5"><span className="material-symbols-outlined text-[14px]">close</span></button>
</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
        Method: Deterministic + AI
        <button className="hover:text-error ml-0.5"><span className="material-symbols-outlined text-[14px]">close</span></button>
</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
        Currencies: INR (₹)
      </span>
<button className="font-label-sm text-label-sm text-secondary hover:underline ml-auto font-medium">Reset All Filters</button>
</div>
</div>
{/*  Ledger Table Canvas Container  */}
<div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col">
{/*  Tabular Scroller  */}
<div className="overflow-x-auto w-full">
<table className="w-full text-left border-collapse min-w-[980px]">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
<th className="py-3 px-4 font-semibold w-10 text-center">
<input aria-label="Select all transactions" className="rounded bg-surface-container-lowest focus:ring-0 cursor-pointer" type="checkbox"/>
</th>
<th className="py-3 px-4 font-semibold">Date</th>
<th className="py-3 px-4 font-semibold">Merchant / Counterparty</th>
<th className="py-3 px-4 font-semibold">Category</th>
<th className="py-3 px-4 font-semibold">Instrument &amp; Account</th>
<th className="py-3 px-4 font-semibold">Categorization Engine</th>
<th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
<th className="py-3 px-4 font-semibold text-center w-20">Audit</th>
</tr>
</thead>
<tbody className="divide-none text-on-surface font-body-md text-body-md" id="ledgerBody">
{loading && (
<tr><td className="py-6 px-4 text-center text-on-surface-variant" colSpan={8}>Loading transactions…</td></tr>
)}
{!loading && error && (
<tr><td className="py-6 px-4 text-center text-error" colSpan={8}>{error}</td></tr>
)}
{!loading && !error && transactions.length === 0 && (
<tr><td className="py-6 px-4 text-center text-on-surface-variant" colSpan={8}>No transactions found.</td></tr>
)}
{!loading && !error && transactions.map((t) => (
<tr key={t.transaction_id} className="hover:bg-surface-container-low transition-colors group">
<td className="py-2.5 px-4 text-center">
<input aria-label={`Select transaction ${t.transaction_id}`} className="rounded bg-surface-container-lowest cursor-pointer" type="checkbox"/>
</td>
<td className="py-2.5 px-4 whitespace-nowrap">
<span className="font-numeric-md text-numeric-md font-medium text-on-surface">{formatDate(t.transaction_date)}</span>
</td>
<td className="py-2.5 px-4 min-w-0">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
<span className="material-symbols-outlined text-[16px]">receipt_long</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-body-md text-body-md font-semibold text-on-surface truncate">{t.merchant_name || t.description}</span>
<span className="font-label-sm text-label-sm text-outline truncate">{t.description}</span>
</div>
</div>
</td>
<td className="py-2.5 px-4 whitespace-nowrap">
<span className="inline-flex items-center px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
{t.category_name || 'Uncategorized'}
</span>
</td>
<td className="py-2.5 px-4 whitespace-nowrap">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span className="font-label-md text-label-md text-on-surface font-medium">{t.account_name}</span>
</div>
</td>
<td className="py-2.5 px-4 whitespace-nowrap">
{t.needs_review ? (
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-medium">
<span className="material-symbols-outlined text-[12px]">flag</span>
                Needs Review
              </span>
) : (
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-primary-fixed-variant font-label-sm text-label-sm font-medium">
<span className="material-symbols-outlined text-[12px]">verified</span>
                Auto-categorized
              </span>
)}
</td>
<td className="py-2.5 px-4 whitespace-nowrap text-right">
<span className={`font-numeric-md text-numeric-md font-semibold ${Number(t.amount) < 0 ? 'text-on-surface' : 'text-secondary'}`}>{formatAmount(t.amount)}</span>
</td>
<td className="py-2.5 px-4 text-center whitespace-nowrap">
<button className="p-1 rounded hover:bg-surface-container-high text-outline group-hover:text-primary-container transition-colors" title="Audit Transaction Details">
<span className="material-symbols-outlined text-[18px]">more_horiz</span>
</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
{/*  Table Footer & Analytical Ledger Controls  */}
<div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-md">
{/*  Showing count text  */}
<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
<span>Showing <span className="font-semibold text-on-surface">{total === 0 ? 0 : (page - 1) * LIMIT + 1}</span> to <span className="font-semibold text-on-surface">{Math.min(page * LIMIT, total)}</span> of <span className="font-semibold text-on-surface">{total.toLocaleString('en-IN')}</span> transactions</span>
</div>
{/*  Pagination Buttons  */}
<div className="flex items-center gap-1 select-none">
<button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-2.5 py-1 rounded bg-surface-container-lowest text-outline hover:text-on-surface text-label-sm font-label-sm font-semibold shadow-sm disabled:opacity-40">
          Previous
        </button>
<span className="w-8 h-8 rounded bg-primary-container text-on-primary font-numeric-sm text-numeric-sm font-semibold shadow-sm flex items-center justify-center">
          {page}
        </span>
<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high text-label-sm font-label-sm font-semibold shadow-sm transition-colors disabled:opacity-40">
          Next
        </button>
</div>
</div>
</div>
{/*  Detailed Ledger Breakdown Cards (Asymmetric Bottom Summary)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop mt-space-lg">
{/*  Visual Spending Flow Preview  */}
<div className="lg:col-span-8 p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between mb-space-sm">
<div>
<h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Monthly Outflow Cadence</h3>
<span className="font-body-sm text-body-sm text-on-surface-variant">Daily transaction velocity across selected October window</span>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="w-2.5 h-2.5 rounded-sm bg-primary-container"></span> Regular Expense
          <span className="w-2.5 h-2.5 rounded-sm bg-secondary ml-2"></span> High Variance
        </div>
</div>
{/*  Inline SVG Spark-Line Bar Spectrum (under 2KB)  */}
<div className="w-full h-32 pt-2">
<svg className="w-full h-full text-primary-container" fill="none" preserveaspectratio="none" viewBox="0 0 700 90">
{/*  Baseline  */}
<line stroke="currentColor" stroke-opacity="0.1" strokeWidth="1" x1="0" x2="700" y1="85" y2="85"></line>
{/*  Bar Groups representing daily spend in Oct  */}
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="30" rx="2" width="14" x="20" y="55"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="23" rx="2" width="14" x="44" y="62"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="37" rx="2" width="14" x="68" y="48"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="15" rx="2" width="14" x="92" y="70"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="45" rx="2" width="14" x="116" y="40"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="27" rx="2" width="14" x="140" y="58"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="53" rx="2" width="14" x="164" y="32"></rect>
{/*  Oct 15 Spike: Blue Tokai + Supplies  */}
<rect className="fill-primary-container" height="61" rx="2" width="14" x="188" y="24"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="20" rx="2" width="14" x="212" y="65"></rect>
{/*  Oct 17 Utility Bill Spike  */}
<rect className="fill-secondary" height="67" rx="2" width="14" x="236" y="18"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="41" rx="2" width="14" x="260" y="44"></rect>
{/*  Oct 19 AWS Subscription Spike  */}
<rect className="fill-secondary" height="73" rx="2" width="14" x="284" y="12"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="35" rx="2" width="14" x="308" y="50"></rect>
{/*  Oct 22 Salary Day indicator (surplus marked)  */}
<rect className="fill-secondary" height="80" rx="2" width="14" x="332" y="5"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="33" rx="2" width="14" x="356" y="52"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="47" rx="2" width="14" x="380" y="38"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="25" rx="2" width="14" x="404" y="60"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="40" rx="2" width="14" x="428" y="45"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="15" rx="2" width="14" x="452" y="70"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="55" rx="2" width="14" x="476" y="30"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="30" rx="2" width="14" x="500" y="55"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="23" rx="2" width="14" x="524" y="62"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="45" rx="2" width="14" x="548" y="40"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="10" rx="2" width="14" x="572" y="75"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="50" rx="2" width="14" x="596" y="35"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="37" rx="2" width="14" x="620" y="48"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="19" rx="2" width="14" x="644" y="66"></rect>
<rect className="fill-surface-variant hover:fill-primary-container transition-colors" height="31" rx="2" width="14" x="668" y="54"></rect>
</svg>
</div>
<div className="flex justify-between items-center text-outline font-label-sm text-label-sm pt-2 border-none">
<span>Oct 01</span>
<span>Oct 08</span>
<span>Oct 15 (Blue Tokai)</span>
<span>Oct 22 (Salary Credit)</span>
<span>Oct 31</span>
</div>
</div>
{/*  Ledger Reconciliation & Audit State Card  */}
<div className="lg:col-span-4 p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Audit Reconciliation</span>
<span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 100% Balanced
          </span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-xs">Double-Entry Ledger Integrity</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">
          Every counterparty posting matches reported core banking statements from HDFC &amp; ICICI servers. No pending suspense balances detected.
        </p>
<div className="space-y-space-xs">
<div className="p-space-xs rounded bg-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Cleared Debits (Oct)</span>
<span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹54,280.50</span>
</div>
<div className="p-space-xs rounded bg-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Verified Credits (Oct)</span>
<span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">₹1,25,000.00</span>
</div>
</div>
</div>
<div className="pt-space-md">
<button className="w-full py-2 px-3 rounded bg-surface-container text-on-primary-fixed-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs">
<span className="material-symbols-outlined text-[18px]">verified</span>
          Generate Monthly Audit Certificate
        </button>
</div>
</div>
</div>
{/*  Manual Entry Modal Drawer (Hidden by default, interactive script toggles)  */}
<div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm hidden flex items-center justify-center p-4" id="manualModal">
<div className="bg-surface-container-lowest rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
{/*  Modal Header  */}
<div className="p-space-md bg-surface-container-low flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">post_add</span>
</div>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-semibold">Add Manual Ledger Entry</h4>
<span className="font-label-sm text-label-sm text-on-surface-variant">Standard GAAP double-entry posting</span>
</div>
</div>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" id="closeModalBtn">
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
{/*  Modal Form Content  */}
<form className="p-space-md flex flex-col gap-space-sm" id="manualEntryForm">
<div className="grid grid-cols-2 gap-space-sm">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Transaction Date</label>
<input className="w-full px-3 py-1.5 rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none" type="date" value="2024-10-24"/>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Instrument Type</label>
<select className="w-full px-3 py-1.5 rounded bg-surface-container-low text-on-surface font-label-md text-label-md focus:outline-none">
<option>UPI / QR Instant</option>
<option>NetBanking (IMPS/NEFT)</option>
<option>Debit Card POS</option>
<option>Cash Expenditure</option>
</select>
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Merchant / Counterparty</label>
<input className="w-full px-3 py-1.5 rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none placeholder:text-outline" placeholder="e.g., Nature's Basket, Office Canteen..." required="" type="text"/>
</div>
<div className="grid grid-cols-2 gap-space-sm">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Category Classification</label>
<select className="w-full px-3 py-1.5 rounded bg-surface-container-low text-on-surface font-label-md text-label-md focus:outline-none">
<option>Dining &amp; Food</option>
<option>Groceries</option>
<option>Transportation</option>
<option>Utilities</option>
<option>Income / Salary</option>
<option>Fitness &amp; Health</option>
<option>Subscriptions</option>
</select>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Associated Account</label>
<select className="w-full px-3 py-1.5 rounded bg-surface-container-low text-on-surface font-label-md text-label-md focus:outline-none">
<option>HDFC Bank ••4091</option>
<option>ICICI Bank ••1822</option>
<option>Petty Cash Drawer</option>
</select>
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Amount (INR ₹)</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 font-numeric-md text-numeric-md font-semibold text-outline">₹</span>
<input className="w-full pl-8 pr-4 py-1.5 rounded bg-surface-container-low text-on-surface font-numeric-md text-numeric-md focus:outline-none" placeholder="0.00" required="" step="0.01" type="number"/>
</div>
</div>
{/*  Rule Match Automation Preview in Modal  */}
<div className="p-space-xs rounded bg-surface-container-low flex items-center gap-space-sm text-on-surface-variant">
<span className="material-symbols-outlined text-secondary text-[20px]">auto_fix_high</span>
<span className="font-body-sm text-body-sm">Our AI Engine will auto-assign tag hash &amp; match reconciliation rules upon save.</span>
</div>
<div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-sm">
<button className="px-4 py-1.5 rounded text-on-surface-variant hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors" id="cancelModalBtn" type="button">
            Cancel
          </button>
<button className="px-5 py-1.5 rounded bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-all shadow-sm" type="submit">
            Post To Ledger
          </button>
</div>
</form>
</div>
</div>
{/*  Interactive Scripts for Filtering, Search, and Modal UX  */}

</div></main></div>
    </>
  );
}
