import React, { useState } from 'react';
import { DailyLog, FoodTemplate } from '../types';

interface DayLogViewProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  dailyLog: DailyLog | null;
  templates: FoodTemplate[];
  onAddEntry: (
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveTemplate: boolean
  ) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
}

export const DayLogView: React.FC<DayLogViewProps> = ({
  currentDate,
  onDateChange,
  dailyLog,
  templates,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().slice(0, 10));
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
          <div className="bg-amber-50/80 border border-amber-200 px-5 py-2.5 rounded-xl text-right min-w-[130px]">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Calories</div>
            <div className="text-2xl font-black text-amber-950">
              {dailyLog?.total_calories ? dailyLog.total_calories.toLocaleString() : 0}{' '}
              <span className="text-xs font-semibold text-amber-700">kcal</span>
            </div>
          </div>
          <div className="bg-orange-50/80 border border-orange-200 px-5 py-2.5 rounded-xl text-right min-w-[130px]">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Protein</div>
            <div className="text-2xl font-black text-orange-950">
              {dailyLog?.total_protein ?? 0} <span className="text-xs font-semibold text-orange-700">g</span>
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
                    <td className="py-3.5 px-4 text-right font-bold text-amber-700 whitespace-nowrap">
                      {entry.calories} kcal
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-orange-700 whitespace-nowrap">
                      {entry.protein > 0 ? `${entry.protein}g` : <span className="text-slate-300 font-normal">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-md hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                      >
                        Delete
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
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
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
              disabled={isSubmitting || !name || !calories}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition hover:shadow cursor-pointer"
            >
              {isSubmitting ? 'Logging...' : '+ Log Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
