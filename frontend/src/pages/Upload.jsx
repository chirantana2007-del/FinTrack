import React, { useState } from 'react';
import apiClient from '../api/client';

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
    setError('');
    setResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await apiClient.post('/upload/csv', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="w-full h-full px-margin-desktop flex items-center justify-between"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b1f3a
- Font: newsreader
- Mode: light
- Roundness: rounded-sm
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-primary-container leading-none">FinTrack</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">Personal Finance Analytics</span></div></div><div className="h-5 w-px bg-surface-variant hidden xl:block"></div><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-0.5 rounded-lg bg-surface-container-low"><span className="material-symbols-outlined text-outline text-[16px]">lock</span><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Verified Ledger</span></div></div><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span><span className="font-label-md text-label-md font-semibold text-primary-container">Oct 2024</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span></div><button onClick={() => alert("No new notifications")} aria-label="Budget Notifications" className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface" type="button"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="h-6 w-px bg-surface-variant"></div><div className="flex items-center gap-space-sm pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiUVZ6t5iI-gkH3oQwhLRnaI-ZZcOKZbh6XJrMbATUZepl_j12Dd17Icr1532K6E0JB_qWjj4Yw5UTYx8iGFMZpaTEVHnZyPI2eIXhSTK1R3QzVrmV7ESqG_cSRyrfBuRG-OV5FkZvQOLAgjOgGcInARxYQqlp6n1PwQFRgzjNBeVMTLDAajEGiWQVNHpqq8mCfg51n-9i70ccueQ_fOO1lJAK8ooC8ioC2Z2RdjOyclKWhY3WtWkqHQ"/><div className="hidden md:flex flex-col text-left"><span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Arjun Patel</span><span className="font-label-sm text-label-sm text-secondary font-medium">Standard Tier</span></div></div></div></div></header><aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg"><div className="px-space-sm flex flex-col gap-space-sm"><div className="px-space-sm pb-space-xs"><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ledger Navigation</span></div><nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm"><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="dashboard" href="/dashboard"><span className="material-symbols-outlined text-[20px]">dashboard</span><span className="font-body-md text-body-md">Dashboard</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="transactions" href="/transactions"><span className="material-symbols-outlined text-[20px]">receipt_long</span><span className="font-body-md text-body-md">Transactions</span></a><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-2 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="upload" href="/upload"><span className="material-symbols-outlined text-[20px]">upload_file</span><span className="font-body-md text-body-md">Upload</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="budgets-goals" href="/budgets"><span className="material-symbols-outlined text-[20px]">savings</span><span className="font-body-md text-body-md">Budgets &amp; Goals</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="ai-insights" href="/insights"><span className="material-symbols-outlined text-[20px]">psychology</span><span className="font-body-md text-body-md">AI Insights</span></a><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="monthly-report" href="/report"><span className="material-symbols-outlined text-[20px]">summarize</span><span className="font-body-md text-body-md">Monthly Report</span></a></nav></div><div className="px-space-sm flex flex-col gap-space-xs pt-space-md bg-surface-container-lowest"><div className="h-px w-full bg-surface-variant mb-space-xs"></div><a className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="account" href="/login"><span className="material-symbols-outlined text-[20px]">manage_accounts</span><span className="font-body-md text-body-md">Login / Account</span></a><div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span><span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">68%</span></div><div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div></div><span className="font-label-sm text-label-sm text-on-surface-variant">₹68,450 of ₹100,000</span></div></div></aside><div className="pl-64"><main className="w-full pt-16 min-h-screen px-margin-desktop py-space-lg bg-background"><div className="flex flex-col w-full gap-space-lg">
{/*  Header Block with Institutional Metadata Tag  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
<div className="flex flex-col gap-space-xs max-w-3xl">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">Parser Engine v3.4.1</span>
<span className="text-outline-variant">•</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> MySQL Buffer Active
        </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">Bank Statement Ingestion</h1>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Upload monthly bank or credit card CSV statements for automated normalization, merchant resolution, and categorization.</p>
</div>
<div className="flex items-center gap-space-sm self-start md:self-auto">
<a className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low text-primary-container hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold" href="#">
<span className="material-symbols-outlined text-[18px]">download_for_offline</span>
<span>Download CSV Sample</span>
</a>
<a className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md" href="#">
<span className="material-symbols-outlined text-[18px]">rule</span>
<span>Heuristic Rules (48)</span>
</a>
</div>
</div>
{/*  Real-time Parsing Validation Notice Banner  */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-start gap-space-md">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
<span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
</div>
<div className="flex flex-col gap-0.5">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary-container">Ingestion Pipeline Notice</span>
<span className="font-label-sm text-label-sm text-outline">•</span>
<span className="font-label-sm text-label-sm text-outline">Executed 14:32 IST</span>
</div>
<p className="font-body-md text-body-md text-on-surface">
<span className="font-medium text-primary-container">Batch #8920 Validation:</span> 3 raw transaction tokens sanitized. Stripped trailing POS codes (<code className="font-numeric-sm text-numeric-sm bg-surface-container-low px-1 py-0.5 rounded text-on-surface">POS*MUM*99120</code>) and resolved merchant entities to <span className="font-semibold text-primary-container">"Swiggy"</span> and <span className="font-semibold text-primary-container">"Zomato"</span>.
        </p>
</div>
</div>
<div className="flex items-center gap-space-sm shrink-0 sm:pl-space-md">
<span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">100% Deterministic</span>
<button aria-label="Dismiss banner" className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
</div>
{/*  Top Ingestion Workspace Bento Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
{/*  Upload Staging Zone (8 cols)  */}
<div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between">
<div className="flex items-center justify-between pb-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">cloud_upload</span>
<h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Upload Statement File</h2>
</div>
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Target Buffer:</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low font-label-sm text-label-sm font-semibold text-primary-container">Production Ingest</span>
</div>
</div>
{/*  Drag and drop zone with interactive styling  */}
<div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="relative group my-space-xs rounded-xl p-space-xl bg-surface-container-low/60 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col items-center justify-center text-center" id="drop-zone">
{/*  SVG Graphic: Statement parsing visualization  */}
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
            Supported schema payload: <strong className="text-on-surface">.csv</strong> (Strict UTF-8 encoding, CRLF / LF line terminations, max 15MB)
          </p>
</div>
<div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-xs">
<span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary">verified</span> HDFC NetBanking
          </span>
<span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary">verified</span> ICICI iMobile
          </span>
<span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary">verified</span> SBI YONO
          </span>
<span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary">verified</span> Axis / Kotak
          </span>
</div>
<input onChange={handleFileChange} accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="statement-file-input" type="file"/>
</div>
{error && (
<p role="alert" className="font-body-sm text-body-sm text-error px-1">{error}</p>
)}
{result && (
<div className="flex flex-col gap-1 px-space-md py-space-sm rounded-lg bg-secondary-container text-on-secondary-container">
<span className="font-label-md text-label-md font-semibold">
              Processed: {result.insertedCount} inserted, {result.failedCount} failed
            </span>
{result.errors?.length > 0 && (
<ul className="font-body-sm text-body-sm list-disc pl-space-md">
{result.errors.map((e) => (
<li key={e.row}>Row {e.row}: {e.reason}</li>
))}
</ul>
)}
</div>
)}
{/*  Footer action bar in staging  */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md mt-space-xs">
<div className="flex items-center gap-space-xs text-on-surface-variant">
<span className="material-symbols-outlined text-[18px] text-outline">verified_user</span>
<span className="font-label-sm text-label-sm">Client-side sanitization prior to multipart transmission</span>
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
{/*  Expected CSV Schema Spec Panel (4 cols)  */}
<div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between pb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">schema</span>
<h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Expected Schema</h2>
</div>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-primary-container font-label-sm text-label-sm uppercase font-semibold">Strict 5-Col</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
          Backend node <code className="bg-surface-container-low px-1 py-0.5 rounded font-numeric-sm text-numeric-sm text-primary-container">csv-parse</code> requires structural alignment on header row index 0.
        </p>
{/*  Column Definitions Dense List  */}
<div className="flex flex-col gap-2 pt-space-xs">
<div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-primary-container">Date</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-outline uppercase font-mono">Mandatory</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
<span className="font-mono text-[11px] text-secondary">YYYY-MM-DD</span>
<span className="font-numeric-sm text-numeric-sm text-outline">e.g. 2024-10-24</span>
</div>
</div>
<div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-primary-container">Description</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-outline uppercase font-mono">Mandatory</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
<span className="font-mono text-[11px] text-secondary">VARCHAR(255)</span>
<span className="font-body-sm text-body-sm truncate max-w-[140px] text-outline">POS/UPI Narration string</span>
</div>
</div>
<div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-primary-container">Amount</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-outline uppercase font-mono">Mandatory</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
<span className="font-mono text-[11px] text-secondary">DECIMAL(12,2)</span>
<span className="font-numeric-sm text-numeric-sm text-outline">₹ Currency format (INR)</span>
</div>
</div>
<div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-primary-container">Account</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-outline uppercase font-mono">Mandatory</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
<span className="font-mono text-[11px] text-secondary">ENUM Identifier</span>
<span className="font-body-sm text-body-sm text-outline">HDFC / ICICI / SBI</span>
</div>
</div>
<div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-primary-container">Reference / UTR</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant uppercase font-mono">Optional</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
<span className="font-mono text-[11px] text-secondary">VARCHAR(64) UNIQUE</span>
<span className="font-numeric-sm text-numeric-sm text-outline">Deduplication key</span>
</div>
</div>
</div>
</div>
<div className="pt-space-md mt-space-sm bg-surface-container-high/40 -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Encoding Standard</span>
<span className="font-mono text-[11px] text-primary-container font-semibold">ISO-8859-1 / UTF-8</span>
</div>
</div>
</div>
{/*  Upload Batch History Table Section  */}
<div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
{/*  Table Toolbar / Subheader  */}
<div className="p-space-lg pb-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-container text-[20px]">history</span>
<h2 className="font-headline-sm text-headline-sm text-primary-container font-semibold">Statement Ingestion History</h2>
</div>
<span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary-container font-numeric-sm text-numeric-sm font-semibold">3 Batches</span>
</div>
<div className="flex items-center gap-space-xs">
<div className="relative">
<span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-outline">search</span>
<input className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary-container transition-all" placeholder="Filter batches..." type="text"/>
</div>
<button aria-label="Refresh batch records" className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">refresh</span>
</button>
</div>
</div>
{/*  Responsive Tabular Container  */}
<div className="w-full overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider">
<th className="py-3 px-space-md font-semibold">Batch ID</th>
<th className="py-3 px-space-md font-semibold">Statement File</th>
<th className="py-3 px-space-md font-semibold">Upload Date</th>
<th className="py-3 px-space-md font-semibold text-right">Parsed Rows</th>
<th className="py-3 px-space-md font-semibold">Linked Account</th>
<th className="py-3 px-space-md font-semibold text-center">Status</th>
<th className="py-3 px-space-md font-semibold text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y-0 text-on-surface font-body-md text-body-md">
{/*  Row 1: HDFC Processed  */}
<tr className="hover:bg-surface-container-low/50 transition-colors">
<td className="py-3.5 px-space-md font-mono text-numeric-sm text-numeric-sm text-outline">#BATCH-8924</td>
<td className="py-3.5 px-space-md">
<div className="flex items-center gap-space-xs font-medium text-primary-container">
<span className="material-symbols-outlined text-secondary text-[18px]">description</span>
<span>HDFC_Savings_Oct2024.csv</span>
</div>
</td>
<td className="py-3.5 px-space-md font-numeric-md text-numeric-md text-on-surface-variant">24 Oct 2024, 14:32</td>
<td className="py-3.5 px-space-md text-right font-mono font-semibold text-primary-container">482 rows</td>
<td className="py-3.5 px-space-md">
<div className="inline-flex items-center gap-space-xs px-2 py-1 rounded bg-surface-container-low text-primary-container font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>HDFC Regalia A/C ••4091</span>
</div>
</td>
<td className="py-3.5 px-space-md text-center">
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
<span>Processed</span>
</span>
</td>
<td className="py-3.5 px-space-md text-right">
<button className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary-container font-label-md text-label-md font-medium transition-colors" type="button">
                View Summary
              </button>
</td>
</tr>
{/*  Row 2: ICICI Processed  */}
<tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-lowest">
<td className="py-3.5 px-space-md font-mono text-numeric-sm text-numeric-sm text-outline">#BATCH-8890</td>
<td className="py-3.5 px-space-md">
<div className="flex items-center gap-space-xs font-medium text-primary-container">
<span className="material-symbols-outlined text-secondary text-[18px]">description</span>
<span>ICICI_Credit_Sep2024.csv</span>
</div>
</td>
<td className="py-3.5 px-space-md font-numeric-md text-numeric-md text-on-surface-variant">02 Oct 2024, 09:15</td>
<td className="py-3.5 px-space-md text-right font-mono font-semibold text-primary-container">215 rows</td>
<td className="py-3.5 px-space-md">
<div className="inline-flex items-center gap-space-xs px-2 py-1 rounded bg-surface-container-low text-primary-container font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>ICICI Sapphiro ••1822</span>
</div>
</td>
<td className="py-3.5 px-space-md text-center">
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
<span>Processed</span>
</span>
</td>
<td className="py-3.5 px-space-md text-right">
<button className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary-container font-label-md text-label-md font-medium transition-colors" type="button">
                View Summary
              </button>
</td>
</tr>
{/*  Row 3: SBI Partial Alert  */}
<tr className="hover:bg-surface-container-low/50 transition-colors">
<td className="py-3.5 px-space-md font-mono text-numeric-sm text-numeric-sm text-outline">#BATCH-8841</td>
<td className="py-3.5 px-space-md">
<div className="flex items-center gap-space-xs font-medium text-primary-container">
<span className="material-symbols-outlined text-outline text-[18px]">description</span>
<span>SBI_Salary_Aug2024.csv</span>
</div>
</td>
<td className="py-3.5 px-space-md font-numeric-md text-numeric-md text-on-surface-variant">01 Sep 2024, 18:45</td>
<td className="py-3.5 px-space-md text-right font-mono font-semibold text-primary-container">340 rows</td>
<td className="py-3.5 px-space-md">
<div className="inline-flex items-center gap-space-xs px-2 py-1 rounded bg-surface-container-low text-primary-container font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-outline"></span>
<span>SBI Savings ••6710</span>
</div>
</td>
<td className="py-3.5 px-space-md text-center">
<div className="relative group inline-block">
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold cursor-help">
<span className="material-symbols-outlined text-[14px]">warning</span>
<span>Partial (2 skipped)</span>
</span>
{/*  Tooltip for Duplicate Record details  */}
<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col w-56 p-2 rounded bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm shadow-md pointer-events-none z-30">
<span className="font-semibold text-tertiary-fixed">Composite Index Collision</span>
<span className="text-[10px] mt-0.5">Duplicate UTR #88219 rejected to avoid balance double-counting.</span>
</div>
</div>
</td>
<td className="py-3.5 px-space-md text-right">
<button className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md font-medium transition-colors" type="button">
                View Details
              </button>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Institutional Ingestion Ledger Summary Strip  */}
<div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
<span className="font-mono uppercase font-semibold text-outline">Ledger Integrity:</span>
<span className="text-on-surface">1,037 total parsed rows committed to SQLite/MySQL active store.</span>
</div>
<div className="flex items-center gap-space-md">
<span className="font-numeric-sm text-numeric-sm text-outline">Storage Footprint: 2.1 MB</span>
<a className="text-secondary hover:underline font-label-sm text-label-sm font-semibold" href="#">Audit Database Logs →</a>
</div>
</div>
</div>
{/*  Bottom Technical Architecture Callout Note  */}
<div className="rounded-xl bg-surface-container-low p-space-md flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5 shrink-0">database</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
<strong className="text-primary-container font-semibold">Atomic Ingestion Guarantee:</strong> Statements are committed atomically via a single MySQL transaction block. Duplicate records are resolved automatically at the storage engine tier via the composite index <code className="font-mono text-[11px] bg-surface-container-high px-1.5 py-0.5 rounded text-primary-container font-semibold">(account_id, transaction_date)</code>. If an unrecoverable parse exception occurs mid-file, the staging transaction is rolled back with zero schema corruption.
    </p>
</div>
</div>
{/*  Client-side Micro-interactions for Drag-and-Drop Feedback  */}
</main></div>
    </>
  );
}
