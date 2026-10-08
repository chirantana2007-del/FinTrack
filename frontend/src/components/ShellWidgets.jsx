import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { getUser } from '../api/auth';

// Small pieces of the page header/sidebar that every page repeats, backed by
// real data instead of the design mockup's placeholders.

const inr = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

export function CurrentMonthLabel() {
  return <>{new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</>;
}

export function ProfileChip() {
  const user = getUser();
  return (
    <div className="flex items-center gap-space-sm pl-space-xs">
      <img
        alt="Profile"
        className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'FinTrack User')}&background=0b1f3a&color=fff`}
      />
      <div className="hidden md:flex flex-col text-left">
        <span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">{user?.name || 'Account'}</span>
        <span className="font-label-sm text-label-sm text-secondary font-medium">{user?.role === 'admin' ? 'Administrator' : 'Standard Tier'}</span>
      </div>
    </div>
  );
}

// Sidebar card: this month's total spend against the sum of this month's budgets.
export function MonthlyCapCard() {
  const [cap, setCap] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/budgets')
      .then(({ data }) => {
        if (cancelled) return;
        const limit = data.budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
        const spent = data.budgets.reduce((sum, b) => sum + Number(b.spent), 0);
        setCap({ limit, spent, pct: limit > 0 ? (spent / limit) * 100 : null, count: data.budgets.length });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!cap) return null;

  return (
    <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm font-semibold uppercase text-outline">Monthly Cap</span>
        <span className="font-numeric-sm text-numeric-sm font-semibold text-secondary">
          {cap.pct === null ? '-' : `${Math.round(cap.pct)}%`}
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${cap.pct >= 100 ? 'bg-error' : cap.pct >= 80 ? 'bg-on-tertiary-container' : 'bg-secondary'}`}
          style={{ width: `${Math.min(100, cap.pct || 0)}%` }}
        ></div>
      </div>
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {cap.count ? `${inr(cap.spent)} of ${inr(cap.limit)}` : 'No budgets set'}
      </span>
    </div>
  );
}
