import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NotificationBell from '../components/NotificationBell';
import AdminNavLink from '../components/AdminNavLink';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import apiClient from '../api/client';
import { clearSession } from '../api/auth';
import { ProfileChip } from '../components/ShellWidgets';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

const PALETTE = ['#0b1f3a', '#006c4a', '#ac8000', '#4d5f7d', '#7587a7', '#ba1a1a', '#69dba8', '#f6be39'];
const OTHER_COLOR = '#c4c6ce';
const GRID = 'rgba(196, 198, 206, 0.35)';

const inr = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
const inr2 = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (value) => {
  const v = Math.abs(Number(value) || 0);
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

function monthText(monthStart) {
  if (!monthStart) return '';
  const [year, month] = monthStart.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Draws "TOTAL SPENT / ₹x" inside the doughnut hole.
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart, _args, options) {
    if (!options || !options.total) return;
    const { ctx, chartArea } = chart;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    
    const style = getComputedStyle(document.documentElement);
    const labelColor = style.getPropertyValue('--color-outline') || '#75777e';
    const valueColor = style.getPropertyValue('--color-primary-container') || '#0b1f3a';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = labelColor.trim();
    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillText('TOTAL SPENT', x, y - 10);
    ctx.fillStyle = valueColor.trim();
    ctx.font = '700 20px Inter, sans-serif';
    ctx.fillText(options.total, x, y + 14);
    ctx.restore();
  },
};

const NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/transactions', icon: 'receipt_long', label: 'Transactions' },
  { to: '/upload', icon: 'upload_file', label: 'Upload' },
  { to: '/budgets', icon: 'savings', label: 'Budgets & Goals' },
  { to: '/insights', icon: 'psychology', label: 'AI Insights' },
  { to: '/report', icon: 'summarize', label: 'Monthly Report' },
];

function ChangeBadge({ change, goodWhenDown, suffix }) {
  if (change === null || change === undefined) {
    return <span className="font-body-sm text-body-sm text-outline">No prior-month data</span>;
  }
  const good = goodWhenDown ? change <= 0 : change >= 0;
  return (
    <span className={`flex items-center gap-0.5 font-label-sm font-semibold ${good ? 'text-secondary' : 'text-error'}`}>
      <span className="material-symbols-outlined text-[14px]">{change >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
      {Math.abs(change).toFixed(1)}%
      <span className="font-body-sm text-body-sm text-outline font-normal ml-1">{suffix}</span>
    </span>
  );
}

function KpiCard({ label, icon, iconClass, children }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center ${iconClass}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="mt-space-sm">{children}</div>
    </div>
  );
}

function Panel({ title, subtitle, className = '', right, children }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col ${className}`}>
      <div className="flex items-start justify-between pb-space-sm gap-space-sm">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary-container">{title}</h2>
          {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  // The selected month lives in the URL (?month=YYYY-MM) so it survives a
  // refresh and works with Back/Forward and bookmarks. No (or an invalid)
  // ?month = let the server pick.
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam || '') ? monthParam : null;
  const setMonth = (value) => setSearchParams({ month: value.slice(0, 7) });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (requestedMonth, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/analytics/dashboard', {
          params: requestedMonth ? { month: requestedMonth.slice(0, 7) } : {},
        });
        setData(res.data.data);
      } catch (err) {
        if (err.response?.status === 401) {
          clearSession();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.response?.data?.message || err.response?.data?.error || 'Could not load the dashboard.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    load(month);
  }, [month, load]);

  const donut = useMemo(() => {
    if (!data) return null;
    const head = data.categories.slice(0, 7).map((c, i) => ({ name: c.name, amount: c.amount, share: c.share, color: PALETTE[i] }));
    const rest = data.categories.slice(7);
    if (rest.length > 0) {
      const amount = rest.reduce((s, c) => s + c.amount, 0);
      head.push({ name: `Other (${rest.length})`, amount, share: data.totals.expense ? (amount / data.totals.expense) * 100 : 0, color: OTHER_COLOR });
    }
    return head;
  }, [data]);

  const cumulative = useMemo(() => {
    if (!data) return null;
    const { daysInMonth, daysElapsed, isCurrent } = data.period;
    const lastDay = isCurrent ? daysElapsed : daysInMonth;
    const perDay = new Array(daysInMonth).fill(0);
    data.daily.forEach((d) => {
      const day = Number(String(d.date).slice(8, 10));
      if (day >= 1 && day <= daysInMonth) perDay[day - 1] += d.expense;
    });
    let running = 0;
    const actual = perDay.map((v, i) => {
      running += v;
      return i < lastDay ? Math.round(running * 100) / 100 : null;
    });
    const limit = data.budgets.totalLimit;
    const pace = limit ? perDay.map((_, i) => Math.round((limit / daysInMonth) * (i + 1) * 100) / 100) : null;
    return { labels: perDay.map((_, i) => String(i + 1)), actual, pace };
  }, [data]);

  const shell = (content) => (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="w-full h-full px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <img alt="FinTrack logo" className="h-8 w-auto object-contain" src="/favicon.svg" />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span>
              </div>
            </div>
            <div className="h-5 w-px bg-surface-variant hidden xl:block"></div>
            <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low">
              <span className="material-symbols-outlined text-outline text-[16px]">lock</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            {data && (
              <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span>
                <span className="font-label-md text-label-md font-semibold text-primary-container">{data.period.shortLabel}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              </div>
            )}
            <NotificationBell />
            <div className="h-6 w-px bg-surface-variant"></div>
            <ProfileChip />
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg">
        <div className="px-space-sm flex flex-col gap-space-sm">
          <div className="px-space-sm pb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === '/dashboard';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-space-sm px-space-sm py-2 transition-colors ${
                    active
                      ? 'bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm'
                      : 'rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-body-md text-body-md">{item.label}</span>
                </Link>
              );
            })}
            <AdminNavLink />
          </nav>
        </div>
        <div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest">
          <div className="h-px w-full bg-surface-variant mb-space-xs"></div>
          <Link
            to="/login"
            className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            <span className="font-body-md text-body-md">Login / Account</span>
          </Link>
          {data && (
            <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span>
                <span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">
                  {data.budgets.pct === null ? '-' : `${Math.round(data.budgets.pct)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${data.budgets.pct >= 100 ? 'bg-error' : data.budgets.pct >= 80 ? 'bg-on-tertiary-container' : 'bg-secondary'}`}
                  style={{ width: `${Math.min(100, data.budgets.pct || 0)}%` }}
                ></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {data.budgets.items.length ? `${inr(data.budgets.totalSpent)} of ${inr(data.budgets.totalLimit)}` : 'No budgets set'}
              </span>
            </div>
          )}
        </div>
      </aside>

      <div className="pl-64">
        <main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background">{content}</main>
      </div>
    </>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center h-[60vh] gap-space-sm text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-secondary">sync</span>
        <span className="font-body-md text-body-md">Loading your financial overview…</span>
      </div>
    );
  }

  if (error || !data) {
    return shell(
      <div className="flex flex-col items-center justify-center h-[60vh] gap-space-md text-center">
        <span className="material-symbols-outlined text-error text-[40px]">error</span>
        <p className="font-body-lg text-body-lg text-on-surface">{error || 'No data returned.'}</p>
        <button
          type="button"
          onClick={() => load(month)}
          className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const { totals, period, budgets, subscriptions } = data;
  const hasData = totals.transactionCount > 0;
  const budgetTone = budgets.pct === null ? 'text-on-surface' : budgets.pct >= 100 ? 'text-error' : budgets.pct >= 80 ? 'text-on-tertiary-container' : 'text-secondary';

  return shell(
    <div className="flex flex-col w-full gap-space-lg">
      {/* Title + controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider">
            <span>Portfolio Analytics</span>
            <span>•</span>
            <span>Consolidated Ledger</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mt-0.5">Financial Overview</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {period.label}
            <span className="text-outline"> · {period.isCurrent ? `Day ${period.daysElapsed} of ${period.daysInMonth}` : 'Full month'} · {totals.transactionCount} transactions</span>
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <label className="relative inline-flex items-center">
            <span className="material-symbols-outlined text-outline text-[18px] absolute left-3 pointer-events-none">calendar_month</span>
            <select
              aria-label="Select month"
              value={period.month}
              onChange={(e) => setMonth(e.target.value)}
              className="appearance-none pl-10 pr-8 py-1.5 bg-surface-container-lowest text-primary-container font-label-md text-label-md font-semibold rounded-lg shadow-sm hover:bg-surface-container-low transition-colors outline-none cursor-pointer"
            >
              {/* A month from the URL may have no transactions; keep it listed so the
                  picker shows the month actually on screen. */}
              {(data.availableMonths.includes(period.month)
                ? data.availableMonths
                : [...data.availableMonths, period.month].sort().reverse()
              ).map((m) => (
                <option key={m} value={m}>{monthText(m)}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-outline text-[18px] absolute right-2 pointer-events-none">expand_more</span>
          </label>
          <button
            type="button"
            onClick={() => load(month || period.month, true)}
            disabled={refreshing}
            title="Re-run sp_generate_monthly_summary and reload"
            className="flex items-center gap-space-xs px-space-md py-1.5 bg-primary-container text-on-primary rounded-lg shadow-sm hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            <span className="font-label-md text-label-md font-semibold">{refreshing ? 'Refreshing…' : 'Refresh Summary'}</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col items-center text-center gap-space-sm">
          <span className="material-symbols-outlined text-outline text-[44px]">inbox</span>
          <h2 className="font-headline-sm text-headline-sm text-primary-container">No transactions for {period.label}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Upload a bank statement CSV and your spending breakdown, trends and budget tracking will appear here.
          </p>
          <Link to="/upload" className="mt-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-colors">
            Upload a statement
          </Link>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop">
            <KpiCard label="Total Outflow" icon="trending_down" iconClass="text-primary-container">
              <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">{inr(totals.expense)}</div>
              <div className="mt-1">
                <ChangeBadge change={totals.expenseChangePct} goodWhenDown suffix={`vs ${period.previousLabel.split(' ')[0]}`} />
              </div>
            </KpiCard>

            <KpiCard label="Total Inflow" icon="account_balance_wallet" iconClass="text-secondary">
              <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">{inr(totals.income)}</div>
              <div className="flex items-center gap-space-xs mt-1">
                <span className={`px-1.5 py-0.5 rounded-lg font-label-sm font-semibold text-[10px] tracking-wider uppercase ${totals.net >= 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                  {totals.net >= 0 ? 'Surplus' : 'Deficit'}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  Net {totals.net < 0 ? '-' : ''}{inr(Math.abs(totals.net))}
                  {totals.savingsRate !== null ? ` · ${totals.savingsRate.toFixed(0)}% saved` : ''}
                </span>
              </div>
            </KpiCard>

            <KpiCard label="Budget Adherence" icon="pie_chart" iconClass="text-on-tertiary-container">
              {budgets.items.length ? (
                <>
                  <div className="flex items-baseline gap-space-xs">
                    <span className={`font-numeric-lg text-numeric-lg font-bold tracking-tight ${budgetTone}`}>{Math.round(budgets.pct)}%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">of {inr(budgets.totalLimit)} limit</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-1">
                    <span className={`font-label-sm text-label-sm font-semibold ${budgets.overCount ? 'text-error' : 'text-secondary'}`}>
                      {budgets.overCount ? `${budgets.overCount} over limit` : `${inr(Math.max(0, budgets.totalLimit - budgets.totalSpent))} remaining`}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">—</div>
                  <Link to="/budgets" className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline mt-1 inline-block">
                    Set budgets →
                  </Link>
                </>
              )}
            </KpiCard>

            <KpiCard label="Recurring Payments" icon="autorenew" iconClass="text-primary-container">
              <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">{subscriptions.count} Tracked</div>
              <div className="flex items-center gap-space-xs mt-1 truncate">
                {subscriptions.items[0] ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0"></span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      {subscriptions.items[0].merchant} ({inr(subscriptions.items[0].amount)})
                    </span>
                    {subscriptions.items[0].nextDue && (
                      <span className="font-label-sm text-label-sm text-outline flex-shrink-0">due {String(subscriptions.items[0].nextDue).slice(5, 10)}</span>
                    )}
                  </>
                ) : (
                  <span className="font-body-sm text-body-sm text-outline">None detected yet</span>
                )}
              </div>
            </KpiCard>
          </div>

          {/* Category donut + budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
            <Panel
              className="lg:col-span-7"
              title="Category Spending Breakdown"
              subtitle={`Share of ${inr(totals.expense)} total outflow`}
              right={<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-semibold">{data.categories.length} categories</span>}
            >
              <div className="flex flex-col md:flex-row items-center gap-space-lg my-space-sm">
                <div className="relative w-56 h-56 flex-shrink-0">
                  <Doughnut
                    plugins={[centerTextPlugin]}
                    data={{
                      labels: donut.map((c) => c.name),
                      datasets: [{ data: donut.map((c) => c.amount), backgroundColor: donut.map((c) => c.color), borderColor: '#ffffff', borderWidth: 3, hoverOffset: 6 }],
                    }}
                    options={{
                      cutout: '68%',
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        centerText: { total: inr(totals.expense) },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${inr(ctx.parsed)} (${donut[ctx.dataIndex].share.toFixed(1)}%)`,
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-space-md gap-y-space-xs w-full">
                  {donut.map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-xs truncate">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }}></span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">{c.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 pl-space-xs">
                        <span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">{inr(c.amount)}</span>
                        <span className="font-label-sm text-label-sm text-outline block text-[10px]">{c.share.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between mt-auto">
                <div className="flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined text-[20px] ${totals.needsReviewCount ? 'text-on-tertiary-container' : 'text-secondary'}`}>
                    {totals.needsReviewCount ? 'rule' : 'verified'}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {totals.needsReviewCount
                      ? `${totals.needsReviewCount} of ${totals.transactionCount} transactions need categorisation review.`
                      : `All ${totals.transactionCount} transactions were categorised automatically.`}
                  </span>
                </div>
                <Link className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline" to="/transactions">
                  Open ledger →
                </Link>
              </div>
            </Panel>

            <Panel
              className="lg:col-span-5"
              title="Active Category Budgets"
              subtitle="Spend vs. assigned envelope for the month"
              right={<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-outline font-semibold">{budgets.items.length} Active</span>}
            >
              {budgets.items.length === 0 ? (
                <div className="flex flex-col items-start gap-space-xs text-on-surface-variant py-space-md">
                  <p className="font-body-md text-body-md">No budgets are set for {period.label}.</p>
                  <Link to="/budgets" className="font-label-md text-label-md font-semibold text-primary-container hover:underline">Create a budget →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-space-md mt-space-xs">
                  {budgets.items.map((b) => {
                    const over = b.pct >= 100;
                    const near = !over && b.pct >= 80;
                    return (
                      <div key={b.budgetId} className={over ? 'p-space-xs rounded-lg bg-error-container/40 flex flex-col gap-1' : 'flex flex-col gap-1'}>
                        <div className="flex justify-between items-baseline font-body-sm gap-space-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium text-on-surface truncate">{b.name}</span>
                            {near && <span className="px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-semibold uppercase tracking-wider">Near limit</span>}
                            {over && <span className="material-symbols-outlined text-error text-[16px]">warning</span>}
                          </div>
                          <span className="font-numeric-sm text-numeric-sm text-on-surface whitespace-nowrap">
                            {inr(b.spent)} <span className="text-outline">/ {inr(b.limit)}</span>{' '}
                            <span className={`font-semibold ml-1 ${over ? 'text-error' : near ? 'text-on-tertiary-container' : 'text-secondary'}`}>({b.pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-error' : near ? 'bg-tertiary-fixed-dim' : 'bg-secondary'}`}
                            style={{ width: `${Math.min(100, b.pct)}%` }}
                          ></div>
                        </div>
                        {over && <span className="font-label-sm text-label-sm font-semibold text-error">{inr(b.spent - b.limit)} over budget</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="pt-space-sm mt-auto flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Adjust thresholds via budget manager</span>
                <Link to="/budgets" className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline">Manage budgets</Link>
              </div>
            </Panel>
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
            <Panel className="lg:col-span-7" title="Income vs Expense" subtitle="Six-month trend ending with the selected month">
              <div className="h-64">
                <Bar
                  data={{
                    labels: data.trend.map((t) => t.label),
                    datasets: [
                      { label: 'Income', data: data.trend.map((t) => t.income), backgroundColor: '#006c4a', borderRadius: 4, maxBarThickness: 28 },
                      { label: 'Expense', data: data.trend.map((t) => t.expense), backgroundColor: '#0b1f3a', borderRadius: 4, maxBarThickness: 28 },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11 } } },
                      tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${inr(ctx.parsed.y)}` } },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                      y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { callback: (v) => `₹${compact(v)}`, font: { family: 'Inter', size: 11 } } },
                    },
                  }}
                />
              </div>
            </Panel>

            <Panel className="lg:col-span-5" title="Cumulative Spend" subtitle={budgets.totalLimit ? 'Actual spend vs. an even pace against your budget' : `Running total of outflow through ${period.shortLabel}`}>
              <div className="h-64">
                <Line
                  data={{
                    labels: cumulative.labels,
                    datasets: [
                      {
                        label: 'Actual spend',
                        data: cumulative.actual,
                        borderColor: '#0b1f3a',
                        backgroundColor: 'rgba(11, 31, 58, 0.10)',
                        fill: true,
                        tension: 0.25,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        spanGaps: false,
                      },
                      ...(cumulative.pace
                        ? [{ label: 'Budget pace', data: cumulative.pace, borderColor: '#ac8000', borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, fill: false }]
                        : []),
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11 } } },
                      tooltip: {
                        callbacks: {
                          title: (items) => `${period.shortLabel.split(' ')[0]} ${items[0].label}`,
                          label: (ctx) => ` ${ctx.dataset.label}: ${inr(ctx.parsed.y)}`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { family: 'Inter', size: 11 } } },
                      y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { callback: (v) => `₹${compact(v)}`, font: { family: 'Inter', size: 11 } } },
                    },
                  }}
                />
              </div>
              {period.isCurrent && totals.projectedExpense !== null && (
                <div className="mt-space-sm p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                  <div className="flex items-center gap-space-xs text-primary-container font-label-md font-semibold">
                    <span className="material-symbols-outlined text-[16px]">insights</span>
                    <span>Proactive Estimate</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    At the current pace, month-end outflow is projected at <strong>{inr(totals.projectedExpense)}</strong>
                    {budgets.totalLimit ? (totals.projectedExpense <= budgets.totalLimit ? `, within your ${inr(budgets.totalLimit)} budget.` : `, above your ${inr(budgets.totalLimit)} budget.`) : '.'}
                  </p>
                </div>
              )}
            </Panel>
          </div>

          {/* Recent transactions + merchants/recurring */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
            <Panel
              className="lg:col-span-8"
              title="Recent Transactions"
              subtitle="Latest debit & credit ledger entries this month"
              right={
                <Link className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline flex items-center gap-0.5" to="/transactions">
                  View All Ledger
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-outline font-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 rounded-l-lg">Entity / Payee</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5 text-right rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((t) => {
                      const credit = t.amount > 0;
                      const name = t.merchant || t.description;
                      return (
                        <tr key={t.id} className="hover:bg-surface-container-low/70 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-space-sm">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[12px] ${credit ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-primary-container'}`}>
                                {String(name).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-body-md text-body-md font-semibold text-on-surface leading-tight truncate max-w-[240px]">{t.description}</span>
                                {t.needsReview && <span className="font-label-sm text-label-sm text-on-tertiary-container">Needs review</span>}
                              </div>
                            </div>
                          </td>
                          <td className={`py-2.5 px-3.5 font-body-sm text-body-sm ${credit ? 'text-secondary font-medium' : 'text-on-surface'}`}>{t.category}</td>
                          <td className="py-2.5 px-3.5 font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">{String(t.date).slice(0, 10)}</td>
                          <td className={`py-2.5 px-3.5 font-numeric-md text-numeric-md font-semibold text-right whitespace-nowrap ${credit ? 'text-secondary' : 'text-on-surface'}`}>
                            {credit ? '+' : '-'}{inr2(Math.abs(t.amount))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="lg:col-span-4 flex flex-col gap-gutter-desktop">
              <Panel title="Top Merchants" subtitle="Largest outflows this month">
                <div className="flex flex-col gap-space-sm">
                  {data.topMerchants.map((m, i) => {
                    const max = data.topMerchants[0].total || 1;
                    return (
                      <div key={m.name} className="flex flex-col gap-1">
                        <div className="flex justify-between items-baseline font-body-sm">
                          <span className="font-medium text-on-surface truncate pr-space-xs">{m.name}</span>
                          <span className="font-numeric-sm text-numeric-sm text-on-surface whitespace-nowrap">{inr(m.total)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(m.total / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Recurring Payments" subtitle={`About ${inr(subscriptions.monthlyTotal)} per month`}>
                {subscriptions.items.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">No recurring charges detected yet.</p>
                ) : (
                  <ul className="flex flex-col gap-space-xs">
                    {subscriptions.items.slice(0, 5).map((s) => (
                      <li key={s.merchant} className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">{s.merchant}</span>
                          <span className="font-label-sm text-label-sm text-outline capitalize">{s.cadence}{s.nextDue ? ` · next ${String(s.nextDue).slice(0, 10)}` : ''}</span>
                        </div>
                        <span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface whitespace-nowrap pl-space-xs">{inr(s.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
