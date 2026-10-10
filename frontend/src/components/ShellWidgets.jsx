import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { clearSession, getUser } from '../api/auth';

// Small pieces of the page header/sidebar that every page repeats, backed by
// real data instead of the design mockup's placeholders.

const inr = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

export function CurrentMonthLabel() {
  return <>{new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</>;
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'FinTrack User')}&background=0b1f3a&color=fff`;
}

// Header profile button; opens an account menu (account details, links, log out).
export function ProfileChip() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      // Arrow keys move between items, as in a native menu.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
        const index = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  // JWTs are stateless, so logging out means dropping the stored token.
  const logOut = () => {
    setOpen(false);
    clearSession();
    navigate('/login', { replace: true });
  };

  const itemClass =
    'w-full flex items-center gap-space-sm px-space-md py-2 text-left font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low focus:bg-surface-container-low focus:outline-none transition-colors';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user?.name || 'your account'}`}
        className="flex items-center gap-space-sm pl-space-xs pr-1 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
      >
        <img alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src={avatarUrl(user?.name)} />
        <span className="hidden md:flex flex-col text-left">
          <span className="font-label-md text-label-md font-semibold text-on-surface leading-tight">{user?.name || 'Account'}</span>
          <span className="font-label-sm text-label-sm text-secondary font-medium">{isAdmin ? 'Administrator' : 'Standard Tier'}</span>
        </span>
        <span className={`material-symbols-outlined text-[18px] text-outline transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest shadow-lg ring-1 ring-outline-variant z-[60] overflow-hidden"
        >
          <div className="flex items-center gap-space-sm px-space-md py-space-md border-b border-surface-variant">
            <img alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-outline-variant" src={avatarUrl(user?.name)} />
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md font-semibold text-on-surface truncate">{user?.name || 'Account'}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{user?.email}</span>
              <span className={`self-start mt-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${isAdmin ? 'bg-primary-container text-on-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                {isAdmin ? 'Administrator' : 'Standard Tier'}
              </span>
            </div>
          </div>

          <div className="py-1">
            <button type="button" role="menuitem" className={itemClass} onClick={() => go('/upload')}>
              <span className="material-symbols-outlined text-[18px] text-outline">history</span>
              Upload history
            </button>
            <button type="button" role="menuitem" className={itemClass} onClick={() => go('/budgets')}>
              <span className="material-symbols-outlined text-[18px] text-outline">savings</span>
              Budgets &amp; goals
            </button>
            {isAdmin && (
              <button type="button" role="menuitem" className={itemClass} onClick={() => go('/admin')}>
                <span className="material-symbols-outlined text-[18px] text-outline">admin_panel_settings</span>
                Admin console
              </button>
            )}
          </div>

          <div className="py-1 border-t border-surface-variant">
            <button type="button" role="menuitem" className={`${itemClass} text-error`} onClick={logOut}>
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Log out
            </button>
          </div>
        </div>
      )}
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
