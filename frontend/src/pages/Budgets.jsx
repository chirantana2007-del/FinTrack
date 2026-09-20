import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [periodMonth, setPeriodMonth] = useState(currentMonthValue());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadBudgets = () => {
    setLoading(true);
    setError('');
    apiClient
      .get('/budgets')
      .then((response) => setBudgets(response.data.budgets))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load budgets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBudgets();
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
      loadBudgets();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full">
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
<span className="font-numeric-sm text-numeric-sm text-on-surface-variant">FY 2024-25 Q3</span>
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
<span className="font-headline-md text-headline-md text-on-surface">October 2024 Allocation Ledger</span>
</div>
<div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1 rounded-full">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-numeric-sm text-numeric-sm text-on-surface font-semibold">5 Active Enforcements</span>
</div>
</div>
{/*  Macro Summary Strips  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 relative z-10 bg-surface-container-low/60 rounded-lg p-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Budget Assigned</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-primary-container mt-0.5">₹80,000</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Allocated Cap</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Actual Disbursed</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-on-surface mt-0.5">₹54,280</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">67.85% utilization</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Available Buffer</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-secondary mt-0.5">₹25,720</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">7 days in cycle</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline">Variance Tolerance</span>
<span className="font-numeric-lg text-numeric-lg font-semibold text-on-tertiary-container mt-0.5">+1.2%</span>
<span className="font-label-sm text-label-sm text-error">1 limit breached</span>
</div>
</div>
{/*  Linear Aggregate Visual Bar  */}
<div className="mt-space-md flex flex-col gap-1.5 relative z-10">
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>Consolidated Trajectory: Day 24 of 31</span>
<span className="font-numeric-sm text-numeric-sm font-semibold text-primary-container">67.9% consumed</span>
</div>
<div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex">
<div className="bg-secondary h-full" style={{ width: "48%" }} title="Essential Expenses (Rent + Grocery)"></div>
<div className="bg-tertiary-fixed-dim h-full" style={{ width: "14%" }} title="Utilities &amp; Daily Discretionary"></div>
<div className="bg-error h-full" style={{ width: "5.9%" }} title="Entertainment Overshoot"></div>
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
<img className="w-14 h-14 rounded-lg object-cover ring-1 ring-primary-fixed-variant" data-alt="An austere architectural close up of crisp sandstone government ministry and central bank ledger records, ambient high-contrast autumn daylight casting long shadows on clean classical stone pillars, muted navy and slate tones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4bPmLeBHZHRaBkEnZcrM2ccvRIWGiMvwbprjt8nKDKlChG38AEon3eNgpjxnE7pfpZBaVHauEWqS9up-DRzdWMS_cE183Z6iHktrEIPzLvspqDZN-ZQl3co9WbQ5KI06pBuj8uEJpFk5ODKjt5Slu9h6HxezJ26IRfMFaBmBMakj4PawzjnEset11hEIevR81rOhM_Em_cJ1eb5o2C6ixtcSaN8u-H1NQOj9gqQ8Mfzg5SOKnmAxT1Q"/>
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
<p className="font-body-md text-body-md text-on-surface-variant col-span-full">No budgets set for this month yet. Create one above.</p>
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
<button className="self-start sm:self-auto px-space-md py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5" id="open-goal-btn">
<span className="material-symbols-outlined text-[18px] text-secondary">add</span>
<span>+ New Goal</span>
</button>
</div>
{/*  Savings Goals Cards Bento  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop">
{/*  Goal 1: Emergency Fund (6 Months Expenses)  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150 relative overflow-hidden">
<div className="flex flex-col gap-space-sm">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Tier 1 Safeguard</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Emergency Fund</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">6 Months Living Expenses</span>
</div>
{/*  Circular Progress SVG Meter (70%)  */}
<div className="relative w-16 h-16 flex items-center justify-center">
<svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="70, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute flex flex-col items-center justify-center">
<span className="font-numeric-sm text-numeric-sm font-bold text-on-surface">70%</span>
</div>
</div>
</div>
{/*  Figures Breakdown  */}
<div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 mt-2">
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Accumulated:</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-secondary">₹2,10,000</span>
</div>
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Target Corpus:</span>
<span className="font-numeric-md text-numeric-md text-on-surface font-semibold">₹3,00,000</span>
</div>
</div>
{/*  Segmented Milestone Bar  */}
<div className="flex flex-col gap-1">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Cadence: ₹15,000 / month</span>
<span className="font-semibold text-primary-container">March 2025</span>
</div>
<div className="grid grid-cols-6 gap-1 h-2">
<div className="bg-secondary rounded-sm"></div>
<div className="bg-secondary rounded-sm"></div>
<div className="bg-secondary rounded-sm"></div>
<div className="bg-secondary rounded-sm"></div>
<div className="bg-surface-container-high rounded-sm"></div>
<div className="bg-surface-container-high rounded-sm"></div>
</div>
</div>
</div>
<div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
            6 Monthly Deposits Complete
          </span>
<button className="font-label-sm text-label-sm text-outline hover:text-on-surface">Settings</button>
</div>
</div>
{/*  Goal 2: Goa Vacation & Travel  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150 relative overflow-hidden">
<div className="flex flex-col gap-space-sm">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Short-Term Experience</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Goa Vacation &amp; Travel</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Year-end Retreat</span>
</div>
{/*  Circular Progress SVG Meter (71.1%)  */}
<div className="relative w-16 h-16 flex items-center justify-center">
<svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="71.1, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute flex flex-col items-center justify-center">
<span className="font-numeric-sm text-numeric-sm font-bold text-on-surface">71.1%</span>
</div>
</div>
</div>
{/*  Figures Breakdown  */}
<div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 mt-2">
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Accumulated:</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-secondary">₹32,000</span>
</div>
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Target Corpus:</span>
<span className="font-numeric-md text-numeric-md text-on-surface font-semibold">₹45,000</span>
</div>
</div>
{/*  Segmented Milestone Bar  */}
<div className="flex flex-col gap-1">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>2 months left • Status: On track</span>
<span className="font-semibold text-primary-container">Dec 2024</span>
</div>
<div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{ width: "71.1%" }}></div>
</div>
</div>
</div>
<div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
            On Track for Dec Execution
          </span>
<button className="font-label-sm text-label-sm text-outline hover:text-on-surface">Settings</button>
</div>
</div>
{/*  Goal 3: New MacBook Pro M3  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150 relative overflow-hidden">
<div className="flex flex-col gap-space-sm">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Capital Equipment</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">New MacBook Pro M3</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Engineering Workstation</span>
</div>
{/*  Circular Progress SVG Meter (50.0%)  */}
<div className="relative w-16 h-16 flex items-center justify-center">
<svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="50, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute flex flex-col items-center justify-center">
<span className="font-numeric-sm text-numeric-sm font-bold text-on-surface">50.0%</span>
</div>
</div>
</div>
{/*  Figures Breakdown  */}
<div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 mt-2">
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Accumulated:</span>
<span className="font-numeric-lg text-numeric-lg font-bold text-primary-container">₹80,000</span>
</div>
<div className="flex justify-between items-baseline">
<span className="font-label-sm text-label-sm text-outline">Target Corpus:</span>
<span className="font-numeric-md text-numeric-md text-on-surface font-semibold">₹1,60,000</span>
</div>
</div>
{/*  Segmented Milestone Bar  */}
<div className="flex flex-col gap-1">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>₹10,000 / mo recurring</span>
<span className="font-semibold text-primary-container">July 2025</span>
</div>
<div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{ width: "50.0%" }}></div>
</div>
</div>
</div>
<div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-outline">laptop_mac</span>
            8 Months Remaining
          </span>
<button className="font-label-sm text-label-sm text-outline hover:text-on-surface">Settings</button>
</div>
</div>
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
    </>
  );
}
