import React from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../api/auth';

// Sidebar entry for the admin console; renders nothing for regular users.
// The backend enforces admin-only access regardless — this just hides the link.
export default function AdminNavLink({ active = false }) {
  if (getUser()?.role !== 'admin') return null;

  return (
    <Link
      to="/admin"
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-space-sm px-space-sm py-2 transition-colors ${
        active
          ? 'bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm'
          : 'rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
      <span className="font-body-md text-body-md">Admin</span>
    </Link>
  );
}
