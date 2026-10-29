import React, { useState } from 'react';
import { DailyLog, FoodTemplate } from '../types';

interface DayLogViewProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  dailyLog: DailyLog | null;
  templates: FoodTemplate[];
  onAddEntry: (entry: { name: string; calories: number; protein: number; template_id?: string | null }, saveTemplate: boolean) => Promise<void>;
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

  // Template autofill handler
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
      // Reset form
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
    <div className="card shadow-md rounded-xl p-6 bg-white border border-gray-100 mb-6">
      {/* Date Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevDay}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            ← Prev
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleNextDay}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Next →
          </button>
        </div>

        {/* Daily Aggregates Badges */}
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Calories</div>
            <div className="text-xl font-bold text-amber-900">
              {dailyLog?.total_calories?.toLocaleString() ?? 0} <span className="text-xs font-normal">kcal</span>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl text-right">
            <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Protein</div>
            <div className="text-xl font-bold text-orange-900">
              {dailyLog?.total_protein ?? 0} <span className="text-xs font-normal">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logged Meal Entries Table */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Logged Items ({dailyLog?.entries?.length ?? 0})
        </h3>
        {(!dailyLog?.entries || dailyLog.entries.length === 0) ? (
          <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No food items logged for this date yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 text-xs">
                  <th className="py-2.5 font-semibold">Food / Meal</th>
                  <th className="py-2.5 font-semibold text-right">Calories</th>
                  <th className="py-2.5 font-semibold text-right">Protein</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyLog.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-800">
                      {entry.name}
                      {entry.template_id && (
                        <span className="ml-2 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Template
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold text-amber-700">
                      {entry.calories} kcal
                    </td>
                    <td className="py-3 text-right font-semibold text-orange-700">
                      {entry.protein > 0 ? `${entry.protein}g` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
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

      {/* Add New Entry Form */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Add Food Item</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Quick template selector */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quick-fill from Saved Template:</label>
              <select
                value={selectedTemplateId}
                onChange={handleSelectTemplate}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-800"
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Food or dish description..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              />
            </div>
            <div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Calories (kcal)"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              />
            </div>
            <div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Protein (g) (opt)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              Save as reusable template for quick entry later
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !name || !calories}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting ? 'Adding...' : '+ Log Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
