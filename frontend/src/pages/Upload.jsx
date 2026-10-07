import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import AdminNavLink from '../components/AdminNavLink';
import { CurrentMonthLabel, ProfileChip, MonthlyCapCard } from '../components/ShellWidgets';
import apiClient from '../api/client';
import { getUser } from '../api/auth';

const NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/transactions', icon: 'receipt_long', label: 'Transactions' },
  { to: '/upload', icon: 'upload_file', label: 'Upload' },
  { to: '/budgets', icon: 'savings', label: 'Budgets & Goals' },
  { to: '/insights', icon: 'psychology', label: 'AI Insights' },
  { to: '/report', icon: 'summarize', label: 'Monthly Report' },
];

// Must match REQUIRED_COLUMNS in backend/src/services/parsing.service.js and
// the multer fileSize limit in backend/src/routes/upload.routes.js.
const SCHEMA = [
  { name: 'transaction_date', type: 'YYYY-MM-DD', example: '2026-10-24' },
  { name: 'description', type: 'Text', example: 'SWIGGY ORDER 48213' },
  { name: 'amount', type: 'Number', example: '-450 spent · 60000 received' },
];
const MAX_FILE_MB = 5;

const STATUS_STYLES = {
  completed: 'bg-secondary-container text-on-secondary-container',
  failed: 'bg-error-container text-on-error-container',
  processing: 'bg-tertiary-fixed text-on-tertiary-fixed',
  pending: 'bg-surface-container-high text-on-surface-variant',
};

const num = (value) => Number(value || 0).toLocaleString('en-IN');

// MySQL returns local 'YYYY-MM-DD HH:MM:SS' strings (dateStrings).
function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// error_log is a JSON array of { row, reason } for row-level problems, or a
// plain message when the whole upload failed.
function parseErrorLog(errorLog) {
  try {
    const parsed = JSON.parse(errorLog);
    if (Array.isArray(parsed)) return parsed.map((e) => `Row ${e.row}: ${e.reason}`);
  } catch {
    // not JSON — fall through
  }
  return [String(errorLog)];
}

export default function Upload() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [history, setHistory] = useState({ uploads: [], uploadCount: 0, rowsImported: 0, activeRuleCount: null });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    apiClient
      .get('/upload/history')
      .then(({ data }) => {
        setHistory(data);
        setHistoryError('');
      })
      .catch((err) => setHistoryError(err.response?.data?.message || 'Could not load your upload history.'))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = (e) => {
    setResult(null);
    setError('');
    setSelectedFile(e.target.files[0] || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
  };

  const handleParse = async () => {
    if (!selectedFile) {
      setError('Choose a CSV file first.');
      return;
    }
    if (selectedFile.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_FILE_MB} MB.`);
      return;
    }
    setError('');
    setResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await apiClient.post('/upload/csv', formData);
      setResult(response.data);
      setBannerDismissed(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      loadHistory();
    }
  };

  const latest = history.uploads[0];
  const visibleUploads = history.uploads.filter((f) => f.original_filename.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
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
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface">
              <span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span>
              <span className="font-label-md text-label-md font-semibold text-primary-container"><CurrentMonthLabel /></span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
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
              const active = item.to === '/upload';
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
          <MonthlyCapCard />
        </div>
      </aside>

      <div className="pl-64">
        <main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
              <div className="flex flex-col gap-space-xs max-w-3xl">
                <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">Bank Statement Ingestion</h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Upload a bank or credit card statement as CSV. Each row is matched to a merchant, categorized and added to your ledger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
                <a
                  className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low text-primary-container hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold"
                  href="/fintrack_sample_statement.csv"
                  download
                >
                  <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                  <span>Download CSV Sample</span>
                </a>
                {history.activeRuleCount !== null && (
                  <span className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">rule</span>
                    {num(history.activeRuleCount)} categorization rules active
                  </span>
                )}
              </div>
            </div>

            {/* Latest upload notice */}
            {latest && !bannerDismissed && (
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{latest.status === 'failed' ? 'error' : 'task_alt'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary-container">Latest upload</span>
                      <span className="font-label-sm text-label-sm text-outline">•</span>
                      <span className="font-label-sm text-label-sm text-outline">{formatDateTime(latest.uploaded_at)}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface">
                      <span className="font-medium text-primary-container">{latest.original_filename}:</span>{' '}
                      {latest.status === 'failed'
                        ? 'the upload failed and no rows were saved.'
                        : `${num(latest.inserted_rows)} of ${num(latest.total_rows)} rows added${latest.failed_rows ? `, ${num(latest.failed_rows)} skipped with errors` : ''}.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm shrink-0 sm:pl-space-md">
                  <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold capitalize ${STATUS_STYLES[latest.status]}`}>{latest.status}</span>
                  <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss" className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
              {/* Upload staging zone */}
              <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between">
                <div className="flex items-center gap-space-xs pb-space-md">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">cloud_upload</span>
                  <h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Upload Statement File</h2>
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative group my-space-xs rounded-xl p-space-xl bg-surface-container-low/60 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm mb-space-md group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 max-w-md">
                    {selectedFile ? (
                      <p className="font-headline-sm text-headline-sm text-primary-container font-medium">{selectedFile.name}</p>
                    ) : (
                      <p className="font-headline-sm text-headline-sm text-primary-container font-medium">
                        Drag and drop statement here, or <span className="text-secondary underline decoration-secondary/40 underline-offset-2">browse filesystem</span>
                      </p>
                    )}
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      <strong className="text-on-surface">.csv</strong> file, UTF-8, up to {MAX_FILE_MB} MB. Export from any bank, then arrange it into the three columns on the right.
                    </p>
                  </div>
                  <code className="mt-space-md px-2.5 py-1 rounded bg-surface-container-lowest text-primary-container font-mono text-[12px] shadow-sm">
                    transaction_date,description,amount
                  </code>
                  <input onChange={handleFileChange} accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" type="file" aria-label="Choose a CSV statement" />
                </div>
                {error && <p role="alert" className="font-body-sm text-body-sm text-error px-1">{error}</p>}
                {result && (
                  <div className="flex flex-col gap-1 px-space-md py-space-sm rounded-lg bg-secondary-container text-on-secondary-container">
                    <span className="font-label-md text-label-md font-semibold">
                      Processed: {result.insertedCount} inserted, {result.duplicateCount > 0 ? `${result.duplicateCount} duplicate (skipped), ` : ''}{result.failedCount} failed
                    </span>
                    {result.subscriptionsDetected > 0 && (
                      <span className="font-body-sm text-body-sm">{result.subscriptionsDetected} recurring subscription{result.subscriptionsDetected === 1 ? '' : 's'} detected in your history.</span>
                    )}
                    {result.errors?.length > 0 && (
                      <ul className="font-body-sm text-body-sm list-disc pl-space-md">
                        {result.errors.map((e) => (
                          <li key={e.row}>Row {e.row}: {e.reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md mt-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-outline">verified_user</span>
                    <span className="font-label-sm text-label-sm">Saved in a single database transaction: all or nothing</span>
                  </div>
                  <div className="flex items-center gap-space-sm w-full sm:w-auto">
                    <button onClick={handleReset} disabled={uploading} className="flex-1 sm:flex-none px-space-md py-2 rounded-lg bg-surface-container-high text-primary-container font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-60" type="button">
                      Reset Staging
                    </button>
                    <button onClick={handleParse} disabled={uploading} className="flex-1 sm:flex-none px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-on-primary-fixed-variant shadow-sm transition-all flex items-center justify-center gap-space-xs disabled:opacity-60" type="button">
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      <span>{uploading ? 'Processing…' : 'Parse & Normalize'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expected CSV schema */}
              <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">schema</span>
                    <h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Expected Schema</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary-container font-label-sm text-label-sm uppercase font-semibold">{SCHEMA.length} columns</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  The first row must be a header with these exact names. Extra columns are ignored.
                </p>
                <div className="flex flex-col gap-2 pt-space-xs">
                  {SCHEMA.map((col) => (
                    <div key={col.name} className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[13px] font-semibold text-primary-container">{col.name}</span>
                        <span className="font-label-sm text-label-sm px-1.5 rounded bg-surface-container-high text-outline uppercase font-mono">Required</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-body-sm font-body-sm">
                        <span className="font-mono text-[11px] text-secondary">{col.type}</span>
                        <span className="text-outline text-right">{col.example}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto p-space-sm rounded-lg bg-surface-container-high/40 flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">Negative</strong> amounts are spending, <strong className="text-on-surface">positive</strong> amounts are income.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload history */}
            <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="p-space-lg pb-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">history</span>
                    <h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Your Upload History</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary-container font-numeric-sm text-numeric-sm font-semibold">
                    {num(history.uploadCount)} {history.uploadCount === 1 ? 'upload' : 'uploads'}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-outline">search</span>
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary-container transition-all"
                      placeholder="Filter by file name…"
                      type="search"
                      aria-label="Filter uploads by file name"
                    />
                  </div>
                  <button onClick={loadHistory} aria-label="Refresh upload history" className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider">
                      <th className="py-3 px-space-md font-semibold">Statement File</th>
                      <th className="py-3 px-space-md font-semibold">Uploaded</th>
                      <th className="py-3 px-space-md font-semibold text-right">Rows</th>
                      <th className="py-3 px-space-md font-semibold text-right">Added</th>
                      <th className="py-3 px-space-md font-semibold text-right">Errors</th>
                      <th className="py-3 px-space-md font-semibold">Account</th>
                      <th className="py-3 px-space-md font-semibold text-center">Status</th>
                      <th className="py-3 px-space-md font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="text-on-surface font-body-md text-body-md">
                    {historyLoading && history.uploads.length === 0 && (
                      <tr><td colSpan={8} className="py-space-lg text-center text-on-surface-variant">Loading…</td></tr>
                    )}
                    {historyError && (
                      <tr><td colSpan={8} role="alert" className="py-space-lg text-center text-error">{historyError}</td></tr>
                    )}
                    {!historyLoading && !historyError && visibleUploads.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-space-lg text-center text-on-surface-variant">
                          {history.uploads.length === 0 ? 'No statements uploaded yet.' : 'No uploads match that name.'}
                        </td>
                      </tr>
                    )}
                    {!historyError && visibleUploads.map((f) => (
                      <React.Fragment key={f.file_id}>
                        <tr className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-space-md">
                            <div className="flex items-center gap-space-xs font-medium text-primary-container">
                              <span className={`material-symbols-outlined text-[18px] ${f.status === 'failed' ? 'text-error' : 'text-secondary'}`}>description</span>
                              <span>{f.original_filename}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-space-md whitespace-nowrap text-on-surface-variant">{formatDateTime(f.uploaded_at)}</td>
                          <td className="py-3.5 px-space-md text-right font-mono">{num(f.total_rows)}</td>
                          <td className="py-3.5 px-space-md text-right font-mono font-semibold text-primary-container">{num(f.inserted_rows)}</td>
                          <td className={`py-3.5 px-space-md text-right font-mono ${f.failed_rows ? 'text-error' : ''}`}>{num(f.failed_rows)}</td>
                          <td className="py-3.5 px-space-md text-on-surface-variant">{f.account_name || '—'}</td>
                          <td className="py-3.5 px-space-md text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold capitalize ${STATUS_STYLES[f.status]}`}>{f.status}</span>
                          </td>
                          <td className="py-3.5 px-space-md text-right">
                            {f.error_log ? (
                              <button
                                type="button"
                                onClick={() => setExpanded(expanded === f.file_id ? null : f.file_id)}
                                aria-expanded={expanded === f.file_id}
                                className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary-container font-label-md text-label-md font-medium transition-colors"
                              >
                                {expanded === f.file_id ? 'Hide errors' : 'View errors'}
                              </button>
                            ) : (
                              <span className="font-label-sm text-label-sm text-outline">—</span>
                            )}
                          </td>
                        </tr>
                        {expanded === f.file_id && (
                          <tr>
                            <td colSpan={8} className="px-space-md pb-space-sm">
                              <ul className="font-body-sm text-body-sm p-space-sm rounded-lg bg-surface-container-low text-on-surface-variant list-disc pl-space-lg">
                                {parseErrorLog(f.error_log).map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface">
                  {num(history.rowsImported)} rows imported across {num(history.uploadCount)} {history.uploadCount === 1 ? 'upload' : 'uploads'}.
                  {history.uploadCount > history.uploads.length && ` Showing the latest ${history.uploads.length}.`}
                </span>
                {isAdmin && (
                  <Link to="/admin" className="text-secondary hover:underline font-label-sm text-label-sm font-semibold">All users' uploads →</Link>
                )}
              </div>
            </div>

            {/* How ingestion works */}
            <div className="rounded-xl bg-surface-container-low p-space-md flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5 shrink-0">database</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
                <strong className="text-primary-container font-semibold">How uploads are saved:</strong> rows with a bad date, description or amount are
                reported and skipped, and the rest go in together in one MySQL transaction, so a database error part-way through saves nothing.
                Re-uploading the same statement is safe: a row whose date, description and amount already exist on the account is skipped as a
                duplicate. After each upload, recurring payments are re-checked for subscriptions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
