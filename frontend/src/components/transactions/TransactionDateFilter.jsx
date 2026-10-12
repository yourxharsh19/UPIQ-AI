import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { createDateRangePreset } from '../../utils/transactionFilters';

const presets = [
  ['this-month', 'This Month'],
  ['last-month', 'Last Month'],
  ['last-30-days', 'Last 30 Days'],
  ['last-90-days', 'Last 90 Days'],
  ['this-year', 'This Year'],
  ['all-time', 'All Time'],
];

export const TransactionDateFilter = ({ dateRange, setDateRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const formatDate = (value) => value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const rangeLabel = dateRange.startDate && dateRange.endDate
    ? `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`
    : 'All dates';
  const invalidRange = dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate;

  const applyPreset = (preset) => {
    setDateRange(createDateRangePreset(preset));
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 light:border-slate-300 light:bg-white light:text-slate-800"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{rangeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="relative ml-auto mt-2 w-72 max-w-full rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl light:border-slate-200 light:bg-white">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick filters</p>
          <div className="grid grid-cols-2 gap-1">
            {presets.map(([value, label]) => (
              <button key={value} type="button" onClick={() => applyPreset(value)} className="rounded-lg px-2 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 light:text-slate-800 light:hover:bg-slate-100">
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-slate-700 pt-3 light:border-slate-200">
            <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom range</p>
            <label className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300 light:text-slate-700">
              From
              <input aria-label="Filter start date" type="date" value={dateRange.startDate} onChange={(event) => setDateRange((range) => ({ ...range, startDate: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 light:border-slate-300 light:bg-white light:text-slate-800" />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-slate-300 light:text-slate-700">
              To
              <input aria-label="Filter end date" type="date" value={dateRange.endDate} onChange={(event) => setDateRange((range) => ({ ...range, endDate: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 light:border-slate-300 light:bg-white light:text-slate-800" />
            </label>
            {invalidRange && <p role="alert" className="mt-2 text-xs text-rose-400">Start date must be on or before end date.</p>}
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setIsOpen(false)} disabled={Boolean(invalidRange)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Apply range</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
