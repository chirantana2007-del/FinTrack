import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const inputClass =
  'w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary-container shadow-sm';
const labelClass = 'font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold';

function Dialog({ title, onClose, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Runs once on open: focusing here on every render would yank the cursor
  // back to the first field whenever the parent re-renders.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    panelRef.current?.querySelector('input')?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/40 backdrop-blur-sm p-space-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface">{title}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormActions({ saving, submitLabel, onCancel }) {
  return (
    <div className="flex justify-end gap-space-sm pt-space-xs">
      <button type="button" onClick={onCancel} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors">
        Cancel
      </button>
      <button type="submit" disabled={saving} className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm disabled:opacity-60">
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

// Create (goal === null) or edit an existing goal.
export function GoalFormModal({ goal, onClose, onSaved }) {
  const editing = Boolean(goal);
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(Number(goal.target_amount)) : '');
  const [currentAmount, setCurrentAmount] = useState(goal ? String(Number(goal.current_amount)) : '');
  const [targetDate, setTargetDate] = useState(goal?.target_date ? String(goal.target_date).slice(0, 10) : '');
  const [status, setStatus] = useState(goal?.status || 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      name,
      target_amount: targetAmount,
      target_date: targetDate || null,
      ...(currentAmount !== '' && { current_amount: currentAmount }),
      ...(editing && { status })
    };
    try {
      if (editing) {
        await apiClient.put(`/goals/${goal.id}`, body);
      } else {
        await apiClient.post('/goals', body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the goal.');
      setSaving(false);
    }
  };

  return (
    <Dialog title={editing ? 'Edit Savings Goal' : 'New Savings Goal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Goal name</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={150} placeholder="e.g. Emergency fund" required />
        </label>
        <div className="grid grid-cols-2 gap-space-sm">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Target (₹)</span>
            <input className={inputClass} type="number" min="1" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="100000" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{editing ? 'Saved so far (₹)' : 'Already saved (₹)'}</span>
            <input className={inputClass} type="number" min="0" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Target date (optional)</span>
          <input className={inputClass} type="date" min={editing ? undefined : todayValue()} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
        {editing && (
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Status</span>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>
        )}
        {error && <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p>}
        <FormActions saving={saving} submitLabel={editing ? 'Save changes' : 'Create goal'} onCancel={onClose} />
      </form>
    </Dialog>
  );
}

export function ContributeModal({ goal, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const remaining = Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`/goals/${goal.id}/contribute`, { amount });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the contribution.');
      setSaving(false);
    }
  };

  return (
    <Dialog title={`Add to ${goal.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Amount (₹)</span>
          <input className={inputClass} type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        {remaining > 0 && (
          <button type="button" onClick={() => setAmount(String(remaining))} className="self-start font-label-sm text-label-sm font-semibold text-secondary hover:underline">
            Fill remaining ₹{remaining.toLocaleString('en-IN')}
          </button>
        )}
        {error && <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p>}
        <FormActions saving={saving} submitLabel="Add contribution" onCancel={onClose} />
      </form>
    </Dialog>
  );
}

// Contribute / Edit / Delete row for a goal card. Delete asks for an inline
// confirmation instead of a browser confirm() dialog.
export function GoalCardActions({ goal, onEdit, onContribute, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await apiClient.delete(`/goals/${goal.id}`);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete.');
      setBusy(false);
      setConfirming(false);
    }
  };

  const buttonClass = 'flex items-center gap-1 px-2.5 py-1 rounded-lg font-label-sm text-label-sm font-semibold transition-colors';

  return (
    <div className="flex flex-col gap-1 mt-space-sm pt-space-sm border-t border-surface-variant">
      {confirming ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-sm text-body-sm text-on-surface">Delete this goal?</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={`${buttonClass} bg-surface-container text-on-surface hover:bg-surface-variant`}>Cancel</button>
            <button type="button" onClick={handleDelete} disabled={busy} className={`${buttonClass} bg-error text-on-error disabled:opacity-60`}>{busy ? 'Deleting…' : 'Delete'}</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {goal.status !== 'abandoned' && (
            <button type="button" onClick={onContribute} className={`${buttonClass} bg-secondary-container text-on-secondary-container hover:opacity-90`}>
              <span className="material-symbols-outlined text-[16px]">add_card</span>Contribute
            </button>
          )}
          <button type="button" onClick={onEdit} className={`${buttonClass} bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high`}>
            <span className="material-symbols-outlined text-[16px]">edit</span>Edit
          </button>
          <button type="button" onClick={() => setConfirming(true)} className={`${buttonClass} bg-surface-container-low text-error hover:bg-surface-container-high`}>
            <span className="material-symbols-outlined text-[16px]">delete</span>Delete
          </button>
        </div>
      )}
      {error && <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p>}
    </div>
  );
}
