import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import AdminNavLink from '../components/AdminNavLink';
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
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [engine, setEngine] = useState('');
  const [amountRange, setAmountRange] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/categories').then(res => setCategories(res.data.categories || []));
    apiClient.get('/accounts').then(res => setAccounts(res.data.accounts || []));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError('');
      let startDate, endDate, minAmount, maxAmount, needsReview;
      if (month) {
        startDate = month + '-01';
        const [y, m] = month.split('-');
        const lastDay = new Date(y, m, 0).getDate();
        endDate = `${month}-${lastDay}`;
      }
      if (amountRange === '<1000') { maxAmount = 1000; }
      else if (amountRange === '1000-10000') { minAmount = 1000; maxAmount = 10000; }
      else if (amountRange === '>50000') { minAmount = 50000; }
      
      if (engine === 'needs_review') needsReview = true;

      apiClient.get('/transactions', { 
        params: { 
          page, limit: LIMIT, search: search || undefined,
          category_id: category || undefined,
          account_id: account || undefined,
          start_date: startDate, end_date: endDate,
          min_amount: minAmount, max_amount: maxAmount,
          needs_review: needsReview
        } 
      })
        .then((response) => {
          setTransactions(response.data.transactions);
          setTotal(response.data.total);
        })
        .catch((err) => setError(err.response?.data?.message || 'Failed to load transactions'))
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(handle);
  }, [page, search, month, category, account, engine, amountRange]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="/favicon.svg"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><NotificationBell /><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://ui-avatars.com/api/?name=Arjun+Patel&background=0b1f3a&color=fff"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a><AdminNavLink /></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full">
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
<button className="flex items-center gap-space-xs px-3.5 py-1.5 rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low transition-all" id="exportBtn" type="button" onClick={() => {
    let startDate, endDate, minAmount, maxAmount, needsReview;
    if (month) {
      startDate = month + "-01";
      const [y, m] = month.split("-");
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${month}-${lastDay}`;
    }
    if (amountRange === "<1000") { maxAmount = 1000; }
    else if (amountRange === "1000-10000") { minAmount = 1000; maxAmount = 10000; }
    else if (amountRange === ">50000") { minAmount = 50000; }
    if (engine === "needs_review") needsReview = true;
    
    const q = new URLSearchParams();
    if (category) q.set("category_id", category);
    if (account) q.set("account_id", account);
    if (startDate) q.set("start_date", startDate);
    if (endDate) q.set("end_date", endDate);
    if (minAmount) q.set("min_amount", minAmount);
    if (maxAmount) q.set("max_amount", maxAmount);
    if (needsReview) q.set("needs_review", needsReview);
    if (search) q.set("search", search);
    
    apiClient.get(`/transactions/export?${q.toString()}`).then(r => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Transactions_Export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }}>
<span className="material-symbols-outlined text-[18px] text-primary-container">file_download</span>
<span className="font-label-md text-label-md font-semibold text-primary-container">Export CSV</span>
</button>
<button className="flex items-center gap-space-xs px-3.5 py-1.5 rounded bg-primary-container text-on-primary shadow-sm hover:bg-primary transition-all" id="manualEntryBtn" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="font-label-md text-label-md font-semibold">Add Manual Entry</span>
</button>
</div>
</div>
</div>
{/* Filter Toolbar (Data Precision Surface)  */}
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
<select value={month} onChange={e => {setPage(1); setMonth(e.target.value);}} className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option value="">All Time</option>
<option value="2026-10">October 2026</option>
<option value="2026-09">September 2026</option>
<option value="2026-08">August 2026</option>
<option value="2026-07">July 2026</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">expand_more</span>
</div>
{/*  Category  */}
<div className="relative">
<select value={category} onChange={e => {setPage(1); setCategory(e.target.value);}} className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option value="">All Categories</option>
{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">filter_list</span>
</div>
{/*  Account  */}
<div className="relative">
<select value={account} onChange={e => {setPage(1); setAccount(e.target.value);}} className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option value="">All Accounts</option>
{accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">account_balance_wallet</span>
</div>
{/*  Engine / Categorization Source  */}
<div className="relative">
<select value={engine} onChange={e => {setPage(1); setEngine(e.target.value);}} className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option value="">All Match Methods</option>
<option value="needs_review">Requires Review</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">neurology</span>
</div>
{/*  Amount Range Quick Pill  */}
<div className="relative col-span-2 sm:col-span-1">
<select value={amountRange} onChange={e => {setPage(1); setAmountRange(e.target.value);}} className="w-full appearance-none pl-3 pr-7 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded focus:outline-none cursor-pointer">
<option value="">Any Amount</option>
<option value="<1000">&lt; ₹1,000</option>
<option value="1000-10000">₹1,000 - ₹10,000</option>
<option value=">50000">&gt; ₹50,000</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">payments</span>
</div>
</div>
</div>
</div>
{/* Ledger Table Canvas Container */}
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
{/* Manual Entry Modal Drawer (Hidden by default, interactive script toggles)  */}
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
