import React, { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import AdminNavLink from '../components/AdminNavLink';
import { CurrentMonthLabel, ProfileChip, MonthlyCapCard } from '../components/ShellWidgets';
import { GoalFormModal, ContributeModal, GoalCardActions } from '../components/GoalDialogs';
import apiClient from '../api/client';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Indian financial year (April–March) label for a YYYY-MM month, e.g. "FY 2026-27 Q3".
function financialQuarterLabel(month) {
  const [year, m] = month.split('-').map(Number);
  const startYear = m >= 4 ? year : year - 1;
  const quarter = Math.floor(((m + 8) % 12) / 3) + 1;
  return `FY ${startYear}-${String(startYear + 1).slice(2)} Q${quarter}`;
}

// Totals for the summary card, from the budgets of the month being viewed.
function summarizeBudgets(budgets, month) {
  const limit = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
  const spent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const withinLimit = budgets.reduce((sum, b) => sum + Math.min(Number(b.spent), Number(b.limit_amount)), 0);
  const overspend = spent - withinLimit;
  const breached = budgets.filter((b) => Number(b.spent) >= Number(b.limit_amount)).length;
  const nearLimit = budgets.filter((b) => {
    const pct = (Number(b.spent) / Number(b.limit_amount)) * 100;
    return pct >= 80 && pct < 100;
  }).length;

  const [year, m] = month.split('-').map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();
  const now = new Date();
  const current = now.getFullYear() === year && now.getMonth() + 1 === m;
  const past = year < now.getFullYear() || (year === now.getFullYear() && m < now.getMonth() + 1);
  let cycle;
  if (current) {
    const daysLeft = daysInMonth - now.getDate();
    cycle = { label: `Day ${now.getDate()} of ${daysInMonth}`, detail: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in cycle` };
  } else if (past) {
    cycle = { label: 'Month closed', detail: 'Cycle ended' };
  } else {
    cycle = { label: 'Upcoming month', detail: 'Cycle not started' };
  }

  return {
    limit,
    spent,
    buffer: limit - spent,
    utilization: limit > 0 ? (spent / limit) * 100 : null,
    // Bar widths are shares of the total limit, capped so the bar never overflows.
    withinPct: limit > 0 ? Math.min((withinLimit / limit) * 100, 100) : 0,
    overPct: limit > 0 ? Math.min((overspend / limit) * 100, 100 - Math.min((withinLimit / limit) * 100, 100)) : 0,
    overspend,
    breached,
    nearLimit,
    cycle
  };
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [periodMonth, setPeriodMonth] = useState(currentMonthValue());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  // null, or { type: 'form' | 'contribute', goal } for the open goal dialog.
  const [goalDialog, setGoalDialog] = useState(null);

  const loadGoals = () => {
    apiClient.get('/goals').then(res => setGoals(res.data.data)).catch(console.error);
  };

  // Month whose budgets are listed (YYYY-MM); the API defaults to the current month.
  const [viewMonth, setViewMonth] = useState(currentMonthValue());

  const loadBudgets = (month = viewMonth) => {
    setLoading(true);
    setError('');
    apiClient
      .get('/budgets', { params: { month } })
      .then((response) => setBudgets(response.data.budgets))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load budgets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBudgets();
    loadGoals();
    apiClient.get('/categories').then((response) => {
      setCategories(response.data.categories.filter((c) => c.type === 'expense'));
    }).catch(() => {});
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!categoryId || !limitAmount) {
      setCreateError('Choose a category and enter a limit.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/budgets', { category_id: categoryId, limit_amount: limitAmount, period_month: periodMonth });
      setCategoryId('');
      setLimitAmount('');
      setShowCreateForm(false);
      // Show the month the budget was created for, so it doesn't seem to vanish.
      setViewMonth(periodMonth);
      loadBudgets(periodMonth);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setCreating(false);
    }
  };

  const summary = summarizeBudgets(budgets, viewMonth);
  const viewMonthLabel = new Date(`${viewMonth}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="/favicon.svg"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container"><CurrentMonthLabel /></span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><NotificationBell /><div className="h-6 w-px bg-surface-variant"></div><ProfileChip /></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a><AdminNavLink /></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><MonthlyCapCard /></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full">
{/*  Interactive Modal Container (Hidden by default)  */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm hidden" id="create-modal">
<div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg p-space-lg mx-4 flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface">Provision Spending Cap or Goal</span>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Direct Transaction Constraint Engine</span>
</div>
<button className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors" id="close-modal-btn">
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
<div className="flex flex-col gap-space-sm pt-2">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Partition Type</label>
<div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-lg">
<button className="py-1.5 px-3 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm" type="button">Monthly Category Cap</button>
<button className="py-1.5 px-3 hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg transition-colors" type="button">Dedicated Savings Goal</button>
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Target Account / Category Code</label>
<input className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="e.g. 5040 - Medical &amp; Health" type="text"/>
</div>
<div className="grid grid-cols-2 gap-3">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Allocation (INR)</label>
<div className="relative flex items-center">
<span className="absolute left-3 font-numeric-md text-numeric-md text-outline">₹</span>
<input className="w-full bg-surface-container-low pl-7 pr-3 py-2 rounded-lg font-numeric-md text-numeric-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="25,000" type="number"/>
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Threshold Notification</label>
<select className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm">
<option>85% Warning Trigger</option>
<option selected="">90% Hard Guardrail</option>
<option>100% Strict Hardstop</option>
</select>
</div>
</div>
</div>
<div className="flex items-center justify-end gap-space-sm pt-4">
<button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" id="cancel-modal-btn" type="button">Abort</button>
<button className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-1.5 shadow-sm" id="commit-modal-btn" type="button">
<span className="material-symbols-outlined text-[16px]">verified</span>
          Commit Definition
        </button>
</div>
</div>
</div>
{/*  Page Header & Action Bar  */}
<div className="flex flex-col md:flex-row md:items-end justify-between pb-space-lg gap-space-md">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2 text-outline">
<span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary">Policy &amp; Ledger Controls</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">{financialQuarterLabel(viewMonth)}</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Budgets &amp; Financial Goals</h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
        High-fidelity category ceilings and institutional savings milestones with continuous real-time ledger verification.
      </p>
</div>
<div className="flex items-center gap-space-sm">
<button className="px-space-sm py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[18px] text-outline">tune</span>
<span>Rebalance</span>
</button>
<button onClick={() => setShowCreateForm((s) => !s)} className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer" id="open-modal-btn" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span>{showCreateForm ? 'Cancel' : '+ Create New Budget'}</span>
</button>
</div>
</div>
{/*  Editorial Visual Scrim / Ambient Header Block  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop mb-space-xl">
{/*  Macro Metric Banner  */}
<div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>
<div className="flex items-start justify-between relative z-10 mb-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Monthly Category Budgets</span>
<span className="font-headline-md text-headline-md text-on-surface">{viewMonthLabel} Allocation Ledger</span>
</div>
<div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1 rounded-full">
<span className={`w-2 h-2 rounded-full ${summary.breached ? 'bg-error' : 'bg-secondary'}`}></span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-semibold">{budgets.length} Active {budgets.length === 1 ? 'Budget' : 'Budgets'}</span>
</div>
</div>
{/*  Macro Summary Strips  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 relative z-10 bg-surface-container-low/60 rounded-lg p-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Budget Assigned</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-primary-container mt-0.5">{formatCurrency(summary.limit)}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Allocated Cap</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Actual Spent</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-on-surface mt-0.5">{formatCurrency(summary.spent)}</span>
<span className={`font-label-sm text-label-sm font-medium ${summary.utilization >= 100 ? 'text-error' : 'text-secondary'}`}>
{summary.utilization === null ? 'No budgets set' : `${summary.utilization.toFixed(1)}% utilization`}
</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">{summary.buffer < 0 ? 'Over Budget' : 'Available Buffer'}</span>
<span className={`font-numeric-lg text-numeric-lg font-semibold mt-0.5 ${summary.buffer < 0 ? 'text-error' : 'text-secondary'}`}>{formatCurrency(Math.abs(summary.buffer))}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">{summary.cycle.detail}</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Limits Breached</span>
<span className={`font-numeric-lg text-numeric-lg font-semibold mt-0.5 ${summary.breached ? 'text-error' : 'text-on-surface'}`}>{summary.breached} of {budgets.length}</span>
<span className={`font-label-sm text-label-sm ${summary.nearLimit ? 'text-on-tertiary-container' : 'text-on-surface-variant'}`}>{summary.nearLimit} near limit (80%+)</span>
</div>
</div>
{/*  Linear Aggregate Visual Bar  */}
<div className="mt-space-md flex flex-col gap-1.5 relative z-10">
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>Consolidated Trajectory: {summary.cycle.label}</span>
<span className="font-numeric-sm text-numeric-sm font-semibold text-primary-container">
{summary.utilization === null ? '—' : `${summary.utilization.toFixed(1)}% consumed`}
</span>
</div>
<div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex">
<div className="bg-secondary h-full" style={{ width: `${summary.withinPct}%` }} title={`Spent within limits: ${formatCurrency(summary.spent - summary.overspend)}`}></div>
<div className="bg-error h-full" style={{ width: `${summary.overPct}%` }} title={`Spent over limits: ${formatCurrency(summary.overspend)}`}></div>
<div className="bg-transparent h-full flex-1"></div>
</div>
</div>
</div>
{/*  Editorial Context & Image Accent Card  */}
<div className="lg:col-span-4 bg-primary-container text-on-primary rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex flex-col gap-2 relative z-10">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed-dim">Institutional Policy</span>
<span className="material-symbols-outlined text-[18px] text-secondary-fixed">shield</span>
</div>
<h2 className="font-headline-sm text-headline-sm text-on-primary">Discretionary Safeguards</h2>
<p className="font-body-sm text-body-sm text-primary-fixed-dim leading-relaxed">
          Dynamic velocity caps monitor daily point-of-sale micro-transactions. Subscriptions, recurring rents, and essential supplies run under high-tier allocation immunity.
        </p>
</div>
{/*  Rich Illustration / Image Placeholder  */}
<div className="relative z-10 mt-4 pt-4 border-t border-primary-fixed-variant/40 flex items-center gap-3">
<img className="w-14 h-14 rounded-lg object-cover ring-1 ring-primary-fixed-variant" data-alt="An austere architectural close up of crisp sandstone government ministry and central bank ledger records, ambient high-contrast autumn daylight casting long shadows on clean classical stone pillars, muted navy and slate tones." src="https://ui-avatars.com/api/?name=FinTrack&background=0b1f3a&color=fff"/>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-semibold text-on-primary leading-tight">Ledger Safe Guard 2.4</span>
<span className="font-label-sm text-label-sm text-primary-fixed-dim">Automated Rule Engine active</span>
</div>
</div>
</div>
</div>
{/*  SECTION 1: Category Budgets Interactive Cards Grid  */}
<div className="flex flex-col gap-space-md mb-space-xl">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Category Allocations &amp; Thresholds</h3>
<span className="px-2 py-0.5 rounded-full bg-surface-container font-numeric-sm text-numeric-sm text-outline">{budgets.length} Rules Evaluated</span>
</div>
<input
  type="month"
  value={viewMonth}
  onChange={(e) => {
    if (!e.target.value) return;
    setViewMonth(e.target.value);
    loadBudgets(e.target.value);
  }}
  aria-label="Show budgets for month"
  className="bg-surface-container-low px-3 py-1.5 rounded-lg font-body-sm text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-primary-container shadow-sm"
/>
</div>
{showCreateForm && (
<form onSubmit={handleCreateBudget} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-end gap-space-sm">
<div className="flex flex-col gap-1 flex-1 w-full">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Category</label>
<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm">
<option value="">Select a category…</option>
{categories.map((c) => (
<option key={c.category_id} value={c.category_id}>{c.name}</option>
))}
</select>
</div>
<div className="flex flex-col gap-1 w-full sm:w-40">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Month</label>
<input value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} type="month" className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm"/>
</div>
<div className="flex flex-col gap-1 w-full sm:w-40">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Limit (INR)</label>
<input value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} type="number" min="1" step="0.01" placeholder="5000" className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-numeric-md text-numeric-md text-on-surface outline-none focus:bg-surface-container-lowest shadow-sm"/>
</div>
<button disabled={creating} type="submit" className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-colors shadow-sm disabled:opacity-60 w-full sm:w-auto">
{creating ? 'Creating…' : 'Create'}
</button>
{createError && <p role="alert" className="font-body-sm text-body-sm text-error basis-full">{createError}</p>}
</form>
)}
{/*  3-Column / 2-Column Responsive Card Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-desktop">
{loading && (
<p className="font-body-md text-body-md text-on-surface-variant col-span-full">Loading budgets…</p>
)}
{!loading && error && (
<p className="font-body-md text-body-md text-error col-span-full">{error}</p>
)}
{!loading && !error && budgets.length === 0 && (
<p className="font-body-md text-body-md text-on-surface-variant col-span-full">No budgets set for {new Date(`${viewMonth}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} yet. Create one above, or pick another month.</p>
)}
{!loading && !error && budgets.map((b) => {
  const pct = Number(b.progress_pct);
  const breached = pct >= 100;
  const warning = !breached && pct >= 80;
  const barColor = breached ? 'bg-error' : warning ? 'bg-on-tertiary-container' : 'bg-secondary';
  const badgeClass = breached
    ? 'bg-error-container text-error'
    : warning
    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
    : 'bg-secondary/10 text-secondary';
  const badgeLabel = breached ? `${pct.toFixed(1)}% Breached` : warning ? `${pct.toFixed(1)}% Guardrail` : `${pct.toFixed(1)}% Healthy`;
  return (
    <div key={b.budget_id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150">
<div>
<div className="flex items-start justify-between mb-3">
<div className="flex items-center gap-2.5">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-[20px]">savings</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface leading-tight">{b.category_name}</span>
<span className="font-label-sm text-label-sm text-outline">{b.period_month}</span>
</div>
</div>
<span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider ${badgeClass}`}>
{badgeLabel}
</span>
</div>
<div className="flex items-baseline justify-between pt-1">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-outline">Disbursed</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-on-surface">{formatCurrency(b.spent)}</span>
</div>
<div className="flex flex-col items-end">
<span className="font-label-sm text-label-sm text-outline">Cap Limit</span>
<span className="font-numeric-md text-numeric-md text-on-surface-variant font-medium">{formatCurrency(b.limit_amount)}</span>
</div>
</div>
<div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-3 mb-2">
<div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }}></div>
</div>
</div>
<div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-on-surface-variant">
<div className="flex items-center gap-1.5">
<span className={`material-symbols-outlined text-[16px] ${breached ? 'text-error' : 'text-secondary'}`}>{breached ? 'warning' : 'check_circle'}</span>
<span className="font-label-sm text-label-sm font-medium">
{breached ? `Over by ${formatCurrency(b.spent - b.limit_amount)}` : `Remaining: ${formatCurrency(b.limit_amount - b.spent)}`}
</span>
</div>
</div>
</div>
  );
})}
</div>
</div>
{/*  SECTION 2: Savings Goals & Milestones  */}
<div className="flex flex-col gap-space-md mb-space-xl">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-secondary">flag</span>
<h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Targeted Savings Goals &amp; Milestones</h2>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Earmarked balance allocations backed by dedicated recurring monthly schedules.</span>
</div>
<button onClick={() => setGoalDialog({ type: 'form', goal: null })} type="button" className="self-start sm:self-auto px-space-md py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5" id="open-goal-btn">
<span className="material-symbols-outlined text-[18px] text-secondary">add</span>
<span>+ New Goal</span>
</button>
</div>
{/*  Savings Goals Cards Bento  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop">
{goals.length === 0 ? (
  <p className="font-body-md text-body-md text-on-surface-variant col-span-full">No savings goals created yet.</p>
) : goals.map((goal, i) => {
  const targetAmount = Number(goal.target_amount);
  const currentAmount = Number(goal.current_amount);
  const pct = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  
  let monthsLeftStr = '';
  if (goal.target_date) {
      const now = new Date();
      const target = new Date(goal.target_date);
      const diffTime = target - now;
      if (diffTime > 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffMonths = Math.round(diffDays / 30);
          monthsLeftStr = diffMonths > 0 ? `${diffMonths} months left` : `${diffDays} days left`;
      } else {
          monthsLeftStr = 'Target date passed';
      }
  }
  
  const colors = ['text-secondary', 'text-primary-container', 'text-on-tertiary-container'];
  const ringColors = ['bg-secondary', 'bg-primary-container', 'bg-on-tertiary-container'];
  const color = colors[i % colors.length];
  const ringColor = ringColors[i % ringColors.length];

  return (
    <div key={goal.id} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150 relative overflow-hidden">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col pr-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Savings Milestone</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5 break-words">{goal.name}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant capitalize">{goal.status}</span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
              <path className={color} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.min(100, pct)}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-numeric-sm text-numeric-sm font-bold text-on-surface">{pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 mt-2">
          <div className="flex justify-between items-baseline">
            <span className="font-label-sm text-label-sm text-outline">Accumulated:</span>
            <span className={`font-numeric-lg text-numeric-lg font-bold ${color}`}>{formatCurrency(currentAmount)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-label-sm text-label-sm text-outline">Target Corpus:</span>
            <span className="font-numeric-md text-numeric-md text-on-surface font-semibold">{formatCurrency(targetAmount)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>{monthsLeftStr}</span>
            <span className="font-semibold text-primary-container">{goal.target_date ? String(goal.target_date).slice(0, 10) : 'No Target Date'}</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-1">
            <div className={`${ringColor} h-full rounded-full`} style={{ width: `${Math.min(100, pct)}%` }}></div>
          </div>
        </div>
      </div>
      <GoalCardActions
        goal={goal}
        onEdit={() => setGoalDialog({ type: 'form', goal })}
        onContribute={() => setGoalDialog({ type: 'contribute', goal })}
        onDeleted={loadGoals}
      />
    </div>
  );
})}
</div>
</div>
{/*  Real-time Sparkline & Velocity Trend Analysis  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-xl flex flex-col gap-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Burn Velocity &amp; Day-to-Day Dispersion</span>
<span className="font-headline-sm text-headline-sm text-on-surface">October Cumulative Burn vs Expected Linear Cap</span>
</div>
<div className="flex items-center gap-4 text-outline font-label-sm text-label-sm">
<div className="flex items-center gap-1.5">
<span className="w-3 h-0.5 bg-primary-container rounded-full"></span>
<span>Actual Ledger (₹54,280)</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-3 h-0.5 bg-outline-variant stroke-dasharray rounded-full"></span>
<span>Expected Linear Ceiling</span>
</div>
</div>
</div>
{/*  Inline SVG Sparkline / Velocity Graphic  */}
<div className="w-full h-28 relative">
<svg className="w-full h-full overflow-visible" preserveaspectratio="none" viewBox="0 0 800 100">
{/*  Target Linear Threshold Line  */}
<line stroke="#c4c6ce" stroke-dasharray="4 4" strokeWidth="1.5" x1="0" x2="800" y1="90" y2="20"></line>
{/*  Actual Spend Gradient Area Fill  */}
<defs>
<lineargradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stop-color="#0b1f3a" stop-opacity="0.15"></stop>
<stop offset="100%" stop-color="#0b1f3a" stop-opacity="0.0"></stop>
</lineargradient>
</defs>
<polygon fill="url(#spendGradient)" points="0,95 80,92 160,88 240,82 320,68 400,64 480,52 560,49 600,44 600,100 0,100"></polygon>
{/*  Actual Line Path up to Day 24 (600px of 800px)  */}
<polyline fill="none" points="0,95 80,92 160,88 240,82 320,68 400,64 480,52 560,49 600,44" stroke="#0b1f3a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></polyline>
{/*  Current Day Pin marker  */}
<circle cx="600" cy="44" fill="#006c4a" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
</svg>
</div>
<div className="flex justify-between items-center text-outline font-label-sm text-label-sm pt-1 border-t border-surface-container-high">
<span>Oct 01 • Cycle Start</span>
<span>Oct 10</span>
<span>Oct 20</span>
<span className="font-semibold text-secondary">Oct 24 • Current Day (₹54,280 spent)</span>
<span>Oct 31 • Cycle EOM (Cap: ₹80,000)</span>
</div>
</div>
{/*  System / Database Integration Audit Note  */}
<div className="rounded-xl bg-surface-container-low p-space-md shadow-sm flex items-start gap-space-sm text-on-surface-variant">
<span className="material-symbols-outlined text-outline text-[20px] mt-0.5">terminal</span>
<div className="flex flex-col gap-0.5">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary-container">Database Trigger Notice</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-on-surface">ENGINE_ORACLE_PG_COMPLIANT</span>
</div>
<p className="font-body-sm text-body-sm leading-relaxed">
        Budget status is derived from stored procedure <code className="font-mono text-primary-container bg-surface-container-highest px-1 py-0.2 rounded font-semibold text-[11px]">sp_generate_monthly_summary</code> and enforced in real time via database triggers. Overages trigger automated append logs to audit table <code className="font-mono text-primary-container bg-surface-container-highest px-1 py-0.2 rounded font-semibold text-[11px]">sys_budget_notifications</code>.
      </p>
</div>
</div>
{/*  Client-side Micro-interactions  */}

</div></main></div>
      {goalDialog?.type === 'form' && (
        <GoalFormModal goal={goalDialog.goal} onClose={() => setGoalDialog(null)} onSaved={loadGoals} />
      )}
      {goalDialog?.type === 'contribute' && (
        <ContributeModal goal={goalDialog.goal} onClose={() => setGoalDialog(null)} onSaved={loadGoals} />
      )}
    </>
  );
}
