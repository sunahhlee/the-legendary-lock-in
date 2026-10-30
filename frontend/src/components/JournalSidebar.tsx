import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { JournalEntry } from '../types';

const DEFAULT_LIMIT = 10;
const FILTERED_LIMIT = 1000;

interface JournalSidebarProps {
  // Bump to reload the list (e.g. after saving a journal entry)
  refreshKey: number;
  onSelectDate: (date: string) => void;
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({ refreshKey, onSelectDate }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isFiltered = Boolean(startDate || endDate);
  const rangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    if (rangeInvalid) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .getJournalEntries(
        startDate || undefined,
        endDate || undefined,
        isFiltered ? FILTERED_LIMIT : DEFAULT_LIMIT
      )
      .then((res) => {
        if (!cancelled) setEntries(res);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, refreshKey]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <aside className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 text-left lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:flex lg:flex-col">
      <h2 className="text-base font-black text-slate-900 tracking-tight">Energy Journal</h2>
      <p className="text-xs text-slate-500 mb-4">
        {isFiltered ? 'Entries in selected range' : `Last ${DEFAULT_LIMIT} entries`}
      </p>

      {/* Date range filter */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 min-h-[20px]">
        {rangeInvalid ? (
          <span className="text-[11px] text-red-600 font-semibold">Start date must be before end date</span>
        ) : (
          <span className="text-[11px] text-slate-400">
            {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          </span>
        )}
        {isFiltered && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-3 lg:overflow-y-auto lg:flex-1 pr-0.5">
        {error ? (
          <p className="text-xs text-red-600 py-3 text-center">Couldn't load journal entries.</p>
        ) : !loading && entries.length === 0 && !rangeInvalid ? (
          <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
            {isFiltered ? 'No journal entries in this range.' : 'No journal entries yet.'}
          </p>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.date}
              type="button"
              onClick={() => onSelectDate(entry.date)}
              title="Open this day"
              className="block w-full text-left bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-200 rounded-xl px-3.5 py-3 transition cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-800 mb-1">{entry.date}</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{entry.energy_journal}</p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
