import React, { useEffect, useState } from 'react';
import { DailyLog, FoodTemplate, MealEntry } from '../types';
import { toLocalDateString } from '../dateUtils';

const JOURNAL_MAX_LENGTH = 500;

interface DayLogViewProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  dailyLog: DailyLog | null;
  templates: FoodTemplate[];
  onAddEntry: (
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveTemplate: boolean
  ) => Promise<void>;
  onUpdateEntry: (
    entryId: string,
    update: { name: string; calories: number; protein: number }
  ) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onSaveJournal: (text: string) => Promise<void>;
}

export const DayLogView: React.FC<DayLogViewProps> = ({
  currentDate,
  onDateChange,
  dailyLog,
  templates,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSaveJournal,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Energy journal state (resynced whenever the viewed day or saved text changes)
  const savedJournal = dailyLog?.energy_journal ?? '';
  const [journalText, setJournalText] = useState(savedJournal);
  const [isJournalSaving, setIsJournalSaving] = useState(false);
  useEffect(() => {
    setJournalText(savedJournal);
  }, [dailyLog?.id, savedJournal]);

  const openEdit = (entry: MealEntry) => {
    setEditingEntry(entry);
    setEditName(entry.name);
    setEditCalories(String(entry.calories));
    setEditProtein(String(entry.protein));
  };

  const closeEdit = () => setEditingEntry(null);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editName.trim() || editCalories === '') return;

    setIsEditSaving(true);
    try {
      await onUpdateEntry(editingEntry.id, {
        name: editName.trim(),
        calories: parseFloat(editCalories),
        protein: editProtein ? parseFloat(editProtein) : 0.0,
      });
      closeEdit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleEditDelete = async () => {
    if (!editingEntry) return;

    setIsEditSaving(true);
    try {
      await onDeleteEntry(editingEntry.id);
      closeEdit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleJournalSave = async () => {
    setIsJournalSaving(true);
    try {
      await onSaveJournal(journalText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsJournalSaving(false);
    }
  };

  const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = templates.find((tpl) => tpl.id === templateId);
    if (t) {
      setName(t.name);
      setCalories(String(t.default_calories));
      setProtein(String(t.default_protein));
    }
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onDateChange(toLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(toLocalDateString(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    setIsSubmitting(true);
    try {
      await onAddEntry(
        {
          name: name.trim(),
          calories: parseFloat(calories),
          protein: protein ? parseFloat(protein) : 0.0,
          template_id: selectedTemplateId || null,
        },
        saveAsTemplate
      );
      setName('');
      setCalories('');
      setProtein('');
      setSelectedTemplateId('');
      setSaveAsTemplate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-8 text-left">
      {/* Date Navigation & Macro Totals */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
          >
            ← Prev
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3.5 py-2 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <button
            type="button"
            onClick={handleNextDay}
            className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
          >
            Next →
          </button>
        </div>

        {/* Daily Aggregates Badges */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-50/80 border border-blue-200 px-5 py-2.5 rounded-xl text-right min-w-[130px]">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Calories</div>
            <div className="text-2xl font-black text-blue-950">
              {dailyLog?.total_calories ? dailyLog.total_calories.toLocaleString() : 0}{' '}
              <span className="text-xs font-semibold text-blue-700">kcal</span>
            </div>
          </div>
          <div className="bg-green-50/80 border border-green-200 px-5 py-2.5 rounded-xl text-right min-w-[130px]">
            <div className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Protein</div>
            <div className="text-2xl font-black text-green-950">
              {dailyLog?.total_protein ?? 0} <span className="text-xs font-semibold text-green-700">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logged Items Section */}
      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-800 tracking-tight mb-3">
          Logged Items ({dailyLog?.entries?.length ?? 0})
        </h3>

        {(!dailyLog?.entries || dailyLog.entries.length === 0) ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            No food items logged for this date yet. Use the form below to add your first item.
          </div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-bold">Food / Meal</th>
                  <th className="py-3 px-4 font-bold text-right w-32">Calories</th>
                  <th className="py-3 px-4 font-bold text-right w-28">Protein</th>
                  <th className="py-3 px-4 font-bold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyLog.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <span>{entry.name}</span>
                      {entry.template_id && (
                        <span className="ml-2 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full inline-block">
                          Template
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-700 whitespace-nowrap">
                      {entry.calories} kcal
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-green-700 whitespace-nowrap">
                      {entry.protein > 0 ? `${entry.protein}g` : <span className="text-slate-300 font-normal">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Food Item Section */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Add Food Item</h4>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick template selector */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Quick-fill from Saved Template:
              </label>
              <select
                value={selectedTemplateId}
                onChange={handleSelectTemplate}
                className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              >
                <option value="">-- Select frequent food template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.default_calories} kcal, {t.default_protein}g protein)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Input Fields: Description is wide/large, calories & protein stay compact */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Wide Food Description input */}
            <div className="md:col-span-8">
              <label className="block text-xs font-medium text-slate-500 mb-1">Food / Dish Description</label>
              <input
                type="text"
                placeholder="e.g. 40g Oats w 120g soy milk, 170g yogurt..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            {/* Short Calories input */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Calories (kcal)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="kcal"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            {/* Short Protein input */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Protein (g)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="g (opt)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Action Row: Checkbox on left, Dedicated Log Item Button on right */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
              />
              Save as reusable template for quick entry later
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition hover:shadow cursor-pointer"
            >
              {isSubmitting ? 'Logging...' : '+ Log Item'}
            </button>
          </div>
        </form>
      </div>

      {/* Energy Journal Section */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Energy Journal</h3>
          <span className="text-xs text-slate-400">
            {journalText.length}/{JOURNAL_MAX_LENGTH}
          </span>
        </div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          maxLength={JOURNAL_MAX_LENGTH}
          rows={4}
          placeholder="How did you feel energy-wise today?"
          className="w-full text-sm border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs resize-y"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleJournalSave}
            disabled={isJournalSaving}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
          >
            {isJournalSaving ? 'Saving...' : 'Save Journal'}
          </button>
        </div>
      </div>

      {/* Edit Item Modal (Delete lives here) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md text-left">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">Edit Logged Item</h4>
              <button
                type="button"
                onClick={closeEdit}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Food / Dish Description</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editProtein}
                    onChange={(e) => setEditProtein(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleEditDelete}
                  disabled={isEditSaving}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3.5 py-2 rounded-lg border border-red-200 transition cursor-pointer disabled:opacity-50"
                >
                  Delete
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSaving || !editName.trim() || editCalories === ''}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    {isEditSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
