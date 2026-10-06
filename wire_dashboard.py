import re
import os

filepath = r'c:\Users\ADMIN\Desktop\fintrack\frontend\src\pages\Dashboard.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for useState, useEffect, axios
if 'import React' in content and 'useState' not in content:
    content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';\nimport apiClient from '../api/client';")

# Replace function start
func_start = 'export default function Dashboard() {'
new_func_start = """export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/analytics/dashboard').then(res => {
      if (res.data.success) setDashboardData(res.data.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-center text-on-surface">Loading Dashboard...</div>;
"""
content = content.replace(func_start, new_func_start)

# Replace everything inside <main>
main_regex = re.compile(r'(<main[^>]*>)(.*?)(</main>)', re.DOTALL)

new_main_content = """<div className="flex flex-col w-full gap-space-lg">
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md pb-space-xs">
  <div className="flex flex-col">
    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider">
      <span>Portfolio Analytics</span>
      <span>•</span>
      <span>Consolidated Ledger</span>
    </div>
    <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mt-0.5">Financial Overview</h1>
    <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time transaction reconciliation</p>
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
      <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">₹{dashboardData?.totalOutflow?.toLocaleString()}</div>
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
      <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">₹{dashboardData?.netInflow?.toLocaleString()}</div>
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
        <span className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">{Math.round((dashboardData?.budgetUsed / dashboardData?.budgetLimit) * 100) || 0}%</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">of ₹{dashboardData?.budgetLimit?.toLocaleString()} limit</span>
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
      <div className="font-numeric-lg text-numeric-lg font-bold text-on-surface tracking-tight">{dashboardData?.activeSubscriptions} Tracked</div>
    </div>
  </div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
  <div className="lg:col-span-12 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
    <div>
      <h2 className="font-headline-sm text-headline-sm text-primary-container">Category Spending Breakdown</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-space-lg my-space-md">
        <div className="grid grid-cols-2 gap-x-space-md gap-y-space-xs w-full">
          {dashboardData?.categories?.map((c, i) => (
             <div key={i} className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container-low">
               <div className="flex items-center gap-space-xs truncate">
                 <span className="w-2.5 h-2.5 rounded-sm bg-primary-container flex-shrink-0"></span>
                 <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">{c.name}</span>
               </div>
               <div className="text-right flex-shrink-0 pl-space-xs">
                 <span className="font-numeric-sm text-numeric-sm font-semibold text-on-surface">₹{c.amount?.toLocaleString()}</span>
                 <span className="font-label-sm text-label-sm text-outline block text-[10px]">{Math.round((c.amount / (dashboardData.totalOutflow || 1)) * 100)}%</span>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
</div>"""

updated_content = main_regex.sub(rf'\g<1>{new_main_content}\g<3>', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Dashboard UI dynamic mapping complete.")
