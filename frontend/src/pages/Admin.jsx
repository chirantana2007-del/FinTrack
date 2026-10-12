import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ProfileChip } from '../components/ShellWidgets';
import NotificationBell from '../components/NotificationBell';
import AdminNavLink from '../components/AdminNavLink';

const NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/transactions', icon: 'receipt_long', label: 'Transactions' },
  { to: '/upload', icon: 'upload_file', label: 'Upload' },
  { to: '/budgets', icon: 'savings', label: 'Budgets & Goals' },
  { to: '/insights', icon: 'psychology', label: 'AI Insights' },
  { to: '/report', icon: 'summarize', label: 'Monthly Report' },
];

const TABS = [
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'uploads', label: 'Uploads', icon: 'upload_file' },
  { key: 'audit', label: 'Audit Log', icon: 'history' },
  { key: 'database', label: 'Database', icon: 'database' },
];

const PAGE_SIZE = 25;
const AUTO_REFRESH_MS = 30 * 1000;

const STATUS_STYLES = {
  completed: 'bg-secondary-container text-on-secondary-container',
  failed: 'bg-error-container text-on-error-container',
  processing: 'bg-tertiary-fixed text-on-tertiary-fixed',
  pending: 'bg-surface-container-high text-on-surface-variant',
};

// MySQL returns local 'YYYY-MM-DD HH:MM:SS' strings (dateStrings).
function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const num = (value) => Number(value || 0).toLocaleString('en-IN');

function StatTile({ icon, label, value, sub, tone }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-1">
      <div className="flex items-center gap-space-xs text-on-surface-variant">
        <span className={`material-symbols-outlined text-[18px] ${tone === 'bad' ? 'text-error' : 'text-outline'}`}>{icon}</span>
        <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className={`font-numeric-lg text-numeric-lg font-semibold ${tone === 'bad' ? 'text-error' : 'text-primary-container'}`}>{value}</span>
      {sub && <span className="font-body-sm text-body-sm text-on-surface-variant">{sub}</span>}
    </div>
  );
}

function Pill({ className, children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Pager({ offset, total, onChange }) {
  if (total <= PAGE_SIZE) return null;
  const end = Math.min(offset + PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between gap-space-sm px-space-md py-space-sm bg-surface-container-low">
      <span className="font-body-sm text-body-sm text-on-surface-variant">{offset + 1}–{end} of {num(total)}</span>
      <div className="flex gap-space-xs">
        <button
          type="button"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(offset - PAGE_SIZE, 0))}
          className="px-3 py-1 rounded-lg bg-surface-container-lowest text-primary-container font-label-md text-label-md disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={end >= total}
          onClick={() => onChange(offset + PAGE_SIZE)}
          className="px-3 py-1 rounded-lg bg-surface-container-lowest text-primary-container font-label-md text-label-md disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TableShell({ columns, loading, error, empty, children }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider">
            {columns.map((c) => (
              <th key={c.label} className={`py-3 px-space-md font-semibold whitespace-nowrap ${c.right ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-on-surface font-body-md text-body-md">
          {/* Background refreshes keep the current rows on screen instead of
              flashing "Loading…" every 30 seconds. */}
          {loading && empty && (
            <tr><td colSpan={columns.length} className="py-space-lg text-center text-on-surface-variant">Loading…</td></tr>
          )}
          {error && (
            <tr><td colSpan={columns.length} className="py-space-lg text-center text-error" role="alert">{error}</td></tr>
          )}
          {!loading && !error && empty && (
            <tr><td colSpan={columns.length} className="py-space-lg text-center text-on-surface-variant">Nothing to show.</td></tr>
          )}
          {!error && children}
        </tbody>
      </table>
    </div>
  );
}

const inputClass = 'px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary-container';

// Shared fetch + paging state for the three tables.
// refreshKey changes on Refresh clicks and auto-refresh ticks.
function useAdminList(path, filters, refreshKey) {
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: '' });
  const filterKey = JSON.stringify(filters);
  // Paging is tied to the filters it was set under, so changing a filter
  // drops back to the first page without an extra render/fetch.
  const [page, setPage] = useState({ filterKey, offset: 0 });
  const offset = page.filterKey === filterKey ? page.offset : 0;
  const setOffset = (value) => setPage({ filterKey, offset: value });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    apiClient
      .get(path, { params: { ...JSON.parse(filterKey), limit: PAGE_SIZE, offset } })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data.users || data.uploads || data.entries || [];
        setState({ rows, total: data.total, loading: false, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ rows: [], total: 0, loading: false, error: err.response?.data?.message || 'Could not load data.' });
      });
    return () => {
      cancelled = true;
    };
  }, [path, filterKey, offset, refreshKey]);

  return { ...state, offset, setOffset };
}

function UsersTab({ refreshKey }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const list = useAdminList('/admin/users', { search: query || undefined, role: role || undefined }, refreshKey);

  return (
    <>
      <form
        className="flex flex-wrap items-center gap-space-sm px-space-md pb-space-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
      >
        <input className={inputClass} placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} type="search" aria-label="Search users" />
        <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold">Search</button>
      </form>
      <TableShell
        loading={list.loading}
        error={list.error}
        empty={list.rows.length === 0}
        columns={[
          { label: 'User' }, { label: 'Role' }, { label: 'Status' }, { label: 'Accounts', right: true },
          { label: 'Transactions', right: true }, { label: 'Uploads', right: true }, { label: 'Last login' }, { label: 'Joined' },
        ]}
      >
        {list.rows.map((u) => (
          <tr key={u.user_id} className="hover:bg-surface-container-low/50 transition-colors">
            <td className="py-3 px-space-md">
              <div className="flex flex-col">
                <span className="font-medium text-primary-container">{u.full_name}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{u.email}</span>
              </div>
            </td>
            <td className="py-3 px-space-md">
              <Pill className={u.role === 'admin' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}>{u.role}</Pill>
            </td>
            <td className="py-3 px-space-md">
              <Pill className={u.is_active ? STATUS_STYLES.completed : STATUS_STYLES.failed}>{u.is_active ? 'Active' : 'Inactive'}</Pill>
            </td>
            <td className="py-3 px-space-md text-right font-mono">{num(u.account_count)}</td>
            <td className="py-3 px-space-md text-right font-mono">{num(u.transaction_count)}</td>
            <td className="py-3 px-space-md text-right font-mono">{num(u.upload_count)}</td>
            <td className="py-3 px-space-md whitespace-nowrap text-on-surface-variant">{formatDateTime(u.last_login_at)}</td>
            <td className="py-3 px-space-md whitespace-nowrap text-on-surface-variant">{formatDateTime(u.created_at)}</td>
          </tr>
        ))}
      </TableShell>
      <Pager offset={list.offset} total={list.total} onChange={list.setOffset} />
    </>
  );
}

function UploadsTab({ refreshKey }) {
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState(null);
  const list = useAdminList('/admin/uploads', { status: status || undefined }, refreshKey);

  return (
    <>
      <div className="flex flex-wrap items-center gap-space-sm px-space-md pb-space-md">
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <TableShell
        loading={list.loading}
        error={list.error}
        empty={list.rows.length === 0}
        columns={[
          { label: 'File' }, { label: 'User' }, { label: 'Status' }, { label: 'Rows', right: true },
          { label: 'Inserted', right: true }, { label: 'Failed', right: true }, { label: 'Uploaded' }, { label: '' },
        ]}
      >
        {list.rows.map((f) => (
          <React.Fragment key={f.file_id}>
            <tr className="hover:bg-surface-container-low/50 transition-colors">
              <td className="py-3 px-space-md">
                <div className="flex items-center gap-space-xs font-medium text-primary-container">
                  <span className="material-symbols-outlined text-[18px] text-secondary">description</span>
                  <span>{f.original_filename}</span>
                </div>
                <span className="font-mono text-[11px] text-outline">#{f.file_id}</span>
              </td>
              <td className="py-3 px-space-md font-body-sm text-body-sm text-on-surface-variant">{f.email}</td>
              <td className="py-3 px-space-md"><Pill className={STATUS_STYLES[f.status]}>{f.status}</Pill></td>
              <td className="py-3 px-space-md text-right font-mono">{num(f.total_rows)}</td>
              <td className="py-3 px-space-md text-right font-mono">{num(f.inserted_rows)}</td>
              <td className={`py-3 px-space-md text-right font-mono ${f.failed_rows ? 'text-error' : ''}`}>{num(f.failed_rows)}</td>
              <td className="py-3 px-space-md whitespace-nowrap text-on-surface-variant">{formatDateTime(f.uploaded_at)}</td>
              <td className="py-3 px-space-md text-right">
                {f.error_log && (
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === f.file_id ? null : f.file_id)}
                    className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary-container font-label-md text-label-md"
                    aria-expanded={expanded === f.file_id}
                  >
                    {expanded === f.file_id ? 'Hide errors' : 'View errors'}
                  </button>
                )}
              </td>
            </tr>
            {expanded === f.file_id && (
              <tr>
                <td colSpan={8} className="px-space-md pb-space-sm">
                  <pre className="whitespace-pre-wrap break-words font-mono text-[11px] p-space-sm rounded-lg bg-surface-container-low text-on-surface-variant">{f.error_log}</pre>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </TableShell>
      <Pager offset={list.offset} total={list.total} onChange={list.setOffset} />
    </>
  );
}

const ACTION_STYLES = {
  'auth.login_failed': STATUS_STYLES.failed,
  'upload.failed': STATUS_STYLES.failed,
  'auth.login': STATUS_STYLES.completed,
  'upload.completed': STATUS_STYLES.completed,
};

function AuditTab({ refreshKey }) {
  const [action, setAction] = useState('');
  const list = useAdminList('/admin/audit-log', { action: action || undefined }, refreshKey);

  return (
    <>
      <div className="flex flex-wrap items-center gap-space-sm px-space-md pb-space-md">
        <select className={inputClass} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
          <option value="">All actions</option>
          <option value="auth">All auth events</option>
          <option value="auth.login">Logins</option>
          <option value="auth.login_failed">Failed logins</option>
          <option value="auth.register">Registrations</option>
          <option value="upload">All uploads</option>
          <option value="upload.failed">Failed uploads</option>
          <option value="subscription">Subscription changes</option>
        </select>
      </div>
      <TableShell
        loading={list.loading}
        error={list.error}
        empty={list.rows.length === 0}
        columns={[{ label: 'When' }, { label: 'User' }, { label: 'Action' }, { label: 'Entity' }, { label: 'Details' }]}
      >
        {list.rows.map((e) => (
          <tr key={e.audit_id} className="hover:bg-surface-container-low/50 transition-colors align-top">
            <td className="py-3 px-space-md whitespace-nowrap text-on-surface-variant">{formatDateTime(e.created_at)}</td>
            <td className="py-3 px-space-md font-body-sm text-body-sm">{e.email || <span className="text-outline">anonymous</span>}</td>
            <td className="py-3 px-space-md">
              <Pill className={ACTION_STYLES[e.action] || STATUS_STYLES.pending}>{e.action}</Pill>
            </td>
            <td className="py-3 px-space-md font-mono text-[12px] text-on-surface-variant whitespace-nowrap">
              {e.entity_type ? `${e.entity_type} #${e.entity_id}` : '—'}
            </td>
            <td className="py-3 px-space-md font-mono text-[11px] text-on-surface-variant break-all">
              {e.details ? JSON.stringify(e.details) : '—'}
            </td>
          </tr>
        ))}
      </TableShell>
      <Pager offset={list.offset} total={list.total} onChange={list.setOffset} />
    </>
  );
}

const inr = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function monthName(monthStart) {
  const [year, month] = String(monthStart).split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// "12 min ago" / "in 48 min" relative to the database server's clock.
function relativeTime(value, serverTime) {
  if (!value || !serverTime) return '';
  const diffMin = Math.round(
    (new Date(String(value).replace(' ', 'T')) - new Date(String(serverTime).replace(' ', 'T'))) / 60000
  );
  const abs = Math.abs(diffMin);
  const text = abs < 1 ? 'less than a minute' : abs < 60 ? `${abs} min` : `${Math.floor(abs / 60)} h ${abs % 60} min`;
  return diffMin <= 0 ? `${text} ago` : `in ${text}`;
}

function Section({ title, icon, children, aside }) {
  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary-container text-[20px]">{icon}</span>
          <h3 className="font-headline-sm text-headline-sm text-primary-container font-semibold">{title}</h3>
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

// Database health: the event scheduler, events, routines and trigger, a
// Transactions-vs-MonthlySummary consistency check, and two buttons that run
// the stored procedures on demand.
function DatabaseTab({ refreshKey, onChanged }) {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [dueResult, setDueResult] = useState(null);
  const [dueBusy, setDueBusy] = useState(false);
  const [rebuildMonth, setRebuildMonth] = useState('');
  const [rebuildResult, setRebuildResult] = useState(null);
  const [rebuildBusy, setRebuildBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    apiClient
      .get('/admin/database')
      .then(({ data }) => {
        setHealth(data);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load database health.'));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const runDueCheck = async () => {
    setDueBusy(true);
    setActionError('');
    try {
      const { data } = await apiClient.post('/admin/database/run-due-check');
      setDueResult({ ...data, at: new Date() });
      load();
      onChanged();
    } catch (err) {
      setActionError(err.response?.data?.message || 'The due-soon check failed.');
    } finally {
      setDueBusy(false);
    }
  };

  const rebuild = async () => {
    const month = rebuildMonth || health?.consistency[0]?.month;
    if (!month) return;
    setRebuildBusy(true);
    setActionError('');
    try {
      const { data } = await apiClient.post('/admin/database/rebuild-summary', { month: month.slice(0, 7) });
      setRebuildResult(data);
      load();
      onChanged();
    } catch (err) {
      setActionError(err.response?.data?.message || 'The rebuild failed.');
    } finally {
      setRebuildBusy(false);
    }
  };

  if (error) return <p role="alert" className="px-space-md pb-space-md font-body-sm text-body-sm text-error">{error}</p>;
  if (!health) return <p className="px-space-md pb-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">Loading…</p>;

  const schedulerOn = health.scheduler === 'ON';
  const mismatchedMonths = health.consistency.filter((c) => c.mismatches > 0).length;
  const months = health.consistency.map((c) => c.month);
  const selectedMonth = rebuildMonth || months[0] || '';
  const buttonClass =
    'inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold disabled:opacity-60';

  return (
    <div className="flex flex-col gap-space-lg px-space-md pb-space-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <StatTile
          icon="schedule"
          label="Event scheduler"
          value={schedulerOn ? 'ON' : 'OFF'}
          tone={schedulerOn ? undefined : 'bad'}
          sub={schedulerOn ? 'MySQL runs scheduled events automatically' : 'Events will not run until it is turned on'}
        />
        <StatTile
          icon="database"
          label="Database objects"
          value={num(health.events.length + health.routines.length + health.triggers.length)}
          sub={`${health.events.length} event · ${health.routines.length} routines · ${health.triggers.length} trigger`}
        />
        <StatTile
          icon={mismatchedMonths ? 'error' : 'verified'}
          label="Summary consistency"
          value={mismatchedMonths ? `${mismatchedMonths} month${mismatchedMonths === 1 ? '' : 's'} off` : 'All match'}
          tone={mismatchedMonths ? 'bad' : undefined}
          sub={`${health.consistency.length} months checked against the transactions`}
        />
      </div>

      <Section title="Scheduled events" icon="event_repeat">
        <TableShell
          loading={false}
          error=""
          empty={health.events.length === 0}
          columns={[{ label: 'Event' }, { label: 'Status' }, { label: 'Schedule' }, { label: 'Last ran' }, { label: 'Next run' }, { label: 'Runs' }]}
        >
          {health.events.map((e) => (
            <tr key={e.name} className="align-top">
              <td className="py-3 px-space-md font-mono text-[12px] text-primary-container">{e.name}</td>
              <td className="py-3 px-space-md"><Pill className={e.status === 'ENABLED' ? STATUS_STYLES.completed : STATUS_STYLES.failed}>{e.status.toLowerCase()}</Pill></td>
              <td className="py-3 px-space-md whitespace-nowrap">Every {e.interval_value} {String(e.interval_field).toLowerCase()}{Number(e.interval_value) === 1 ? '' : 's'}</td>
              <td className="py-3 px-space-md whitespace-nowrap">
                {e.last_executed ? (
                  <div className="flex flex-col">
                    <span>{formatDateTime(e.last_executed)}</span>
                    <span className="font-label-sm text-label-sm text-outline">{relativeTime(e.last_executed, health.serverTime)}</span>
                  </div>
                ) : 'Not yet'}
              </td>
              <td className="py-3 px-space-md whitespace-nowrap">
                {e.next_run && schedulerOn ? (
                  <div className="flex flex-col">
                    <span>{formatDateTime(e.next_run)}</span>
                    <span className="font-label-sm text-label-sm text-outline">{relativeTime(e.next_run, health.serverTime)}</span>
                  </div>
                ) : '—'}
              </td>
              <td className="py-3 px-space-md font-mono text-[11px] text-on-surface-variant">{e.definition}</td>
            </tr>
          ))}
        </TableShell>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <Section title="Stored routines" icon="function">
          <ul className="flex flex-col gap-1">
            {health.routines.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-space-sm p-2.5 rounded-lg bg-surface-container-low">
                <span className="font-mono text-[12px] text-primary-container">{r.name}</span>
                <Pill className={STATUS_STYLES.pending}>{String(r.type).toLowerCase()}</Pill>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Triggers" icon="bolt">
          <ul className="flex flex-col gap-1">
            {health.triggers.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-space-sm p-2.5 rounded-lg bg-surface-container-low">
                <span className="font-mono text-[12px] text-primary-container">{t.name}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{t.timing} {t.event} on {t.table_name}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Run stored procedures now" icon="play_circle">
        {actionError && <p role="alert" className="font-body-sm text-body-sm text-error">{actionError}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Due-soon subscription check</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Runs <code className="font-mono text-[12px]">sp_check_upcoming_subscriptions</code> for every user now, instead of waiting for the hourly event.
              It adds one reminder per subscription due in the next 3 days and never repeats one.
            </p>
            <div className="flex flex-wrap items-center gap-space-sm">
              <button type="button" onClick={runDueCheck} disabled={dueBusy} className={buttonClass}>
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                {dueBusy ? 'Running…' : 'Run due-soon check now'}
              </button>
              {dueResult && (
                <span role="status" className="font-body-sm text-body-sm text-on-surface">
                  {dueResult.created
                    ? `Created ${dueResult.created} new reminder${dueResult.created === 1 ? '' : 's'}.`
                    : 'No new reminders: everything due in the next 3 days has already been notified.'}
                </span>
              )}
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Rebuild a month's summary</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Runs <code className="font-mono text-[12px]">sp_generate_monthly_summary</code> for every user with data that month: deletes the month's
              MonthlySummary rows and recomputes them from the transactions.
            </p>
            <div className="flex flex-wrap items-center gap-space-sm">
              <select className={inputClass} value={selectedMonth} onChange={(e) => setRebuildMonth(e.target.value)} aria-label="Month to rebuild" disabled={!months.length}>
                {months.map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
              <button type="button" onClick={rebuild} disabled={rebuildBusy || !months.length} className={buttonClass}>
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                {rebuildBusy ? 'Rebuilding…' : 'Rebuild'}
              </button>
            </div>
            {rebuildResult && (
              <div role="status" className="font-body-sm text-body-sm text-on-surface flex flex-col gap-1">
                <span>{monthName(rebuildResult.month)}: rebuilt for {rebuildResult.users} user{rebuildResult.users === 1 ? '' : 's'}.</span>
                <table className="text-left">
                  <thead>
                    <tr className="text-on-surface-variant font-label-sm text-label-sm uppercase">
                      <th className="pr-space-md font-semibold"></th>
                      <th className="pr-space-md font-semibold text-right">Rows</th>
                      <th className="pr-space-md font-semibold text-right">Income</th>
                      <th className="font-semibold text-right">Spending</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[12px]">
                    {['before', 'after'].map((k) => (
                      <tr key={k}>
                        <td className="pr-space-md capitalize font-body-sm text-body-sm">{k}</td>
                        <td className="pr-space-md text-right">{rebuildResult[k].rows}</td>
                        <td className="pr-space-md text-right">{inr(rebuildResult[k].income)}</td>
                        <td className="text-right">{inr(rebuildResult[k].expense)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Summary consistency"
        icon="fact_check"
        aside={<span className="font-label-sm text-label-sm text-outline">Transactions table vs. MonthlySummary, per user and month</span>}
      >
        <TableShell
          loading={false}
          error=""
          empty={health.consistency.length === 0}
          columns={[
            { label: 'Month' }, { label: 'Income (transactions)', right: true }, { label: 'Income (summary)', right: true },
            { label: 'Spending (transactions)', right: true }, { label: 'Spending (summary)', right: true }, { label: 'Status' },
          ]}
        >
          {health.consistency.map((c) => (
            <tr key={c.month}>
              <td className="py-3 px-space-md whitespace-nowrap">{monthName(c.month)}</td>
              <td className="py-3 px-space-md text-right font-mono">{inr(c.txnIncome)}</td>
              <td className="py-3 px-space-md text-right font-mono">{inr(c.summaryIncome)}</td>
              <td className="py-3 px-space-md text-right font-mono">{inr(c.txnExpense)}</td>
              <td className="py-3 px-space-md text-right font-mono">{inr(c.summaryExpense)}</td>
              <td className="py-3 px-space-md">
                {c.mismatches ? (
                  <Pill className={STATUS_STYLES.failed}>{c.mismatches} of {c.userMonths} users off</Pill>
                ) : (
                  <Pill className={STATUS_STYLES.completed}>Match</Pill>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      </Section>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(() => {
    apiClient
      .get('/admin/dashboard')
      .then(({ data }) => {
        setStats(data);
        setStatsError('');
        setLastUpdated(new Date());
      })
      .catch((err) => setStatsError(err.response?.data?.message || 'Could not load platform stats.'));
  }, []);

  // Reloads the stat tiles and whichever table tab is open.
  const refresh = useCallback(() => {
    loadStats();
    setRefreshKey((key) => key + 1);
  }, [loadStats]);

  useEffect(() => {
    loadStats();
    const timer = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadStats, refresh]);

  const t = stats?.totals;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="w-full h-full px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img alt="FinTrack logo" className="h-8 w-auto object-contain" src="/favicon.svg" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
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
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </Link>
            ))}
            <AdminNavLink active />
          </nav>
        </div>
        <div className="px-space-sm flex flex-col gap-space-xs pt-space-md">
          <div className="h-px w-full bg-surface-variant mb-space-xs"></div>
          <Link
            to="/login"
            className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            <span className="font-body-md text-body-md">Login / Account</span>
          </Link>
        </div>
      </aside>

      <div className="pl-64">
        <main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background">
          <div className="flex flex-col w-full gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Administration</span>
                <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">Admin Console</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Platform users, statement uploads, the audit trail and database health.</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1 self-start md:self-auto">
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Refresh
                </button>
                {lastUpdated && (
                  <span className="font-label-sm text-label-sm text-outline">
                    Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · auto every 30s
                  </span>
                )}
              </div>
            </div>

            {statsError && <p role="alert" className="font-body-sm text-body-sm text-error">{statsError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <StatTile icon="group" label="Users" value={t ? num(t.totalUsers) : '—'} sub={t && `${num(t.activeUsers)} active · ${num(t.admins)} admin · ${num(t.newUsers7d)} new this week`} />
              <StatTile icon="upload_file" label="Uploads" value={t ? num(t.totalUploads) : '—'} sub={t && `${num(t.rowsImported)} rows imported`} />
              <StatTile icon="error" label="Failed uploads" value={t ? num(t.failedUploads) : '—'} tone={t?.failedUploads > 0 ? 'bad' : undefined} sub={t && `${num(t.failedLogins24h)} failed logins in 24h`} />
              <StatTile icon="receipt_long" label="Transactions" value={t ? num(t.totalTransactions) : '—'} sub={t && `${num(t.activeSubscriptions)} active subscriptions tracked`} />
            </div>

            <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div role="tablist" className="flex gap-space-xs px-space-md pt-space-md pb-space-md overflow-x-auto">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    role="tab"
                    type="button"
                    aria-selected={tab === item.key}
                    onClick={() => setTab(item.key)}
                    className={`inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors ${
                      tab === item.key
                        ? 'bg-primary-container text-on-primary font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              {tab === 'users' && <UsersTab refreshKey={refreshKey} />}
              {tab === 'uploads' && <UploadsTab refreshKey={refreshKey} />}
              {tab === 'audit' && <AuditTab refreshKey={refreshKey} />}
              {tab === 'database' && <DatabaseTab refreshKey={refreshKey} onChanged={loadStats} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
