import React, { useState } from 'react';
import { UserGoal } from '../types';
import { toLocalDateString } from '../dateUtils';

interface UserGoalsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoal[];
  onSaveGoal: (goal: {
    calorie_goal: number;
    protein_goal: number;
    start_date: string;
    end_date?: string | null;
  }) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export const UserGoalsModal: React.FC<UserGoalsModalProps> = ({
  userId,
  isOpen,
  onClose,
  goals,
  onSaveGoal,
  onDeleteGoal,
}) => {
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('140');
  const [startDate, setStartDate] = useState(toLocalDateString());
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calorieGoal || !proteinGoal || !startDate) return;

    setIsSubmitting(true);
    try {
      await onSaveGoal({
        calorie_goal: parseFloat(calorieGoal),
        protein_goal: parseFloat(proteinGoal),
        start_date: startDate,
        end_date: endDate ? endDate : null,
      });
      setEndDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-800">Macro &amp; Calorie Goals</h3>
            <p className="text-xs text-slate-500 font-mono">User ID: {userId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Configure New Goal Form */}
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-5">
            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3">
              Configure Macro Target Span
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calorie Limit / Target (kcal)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Protein Target (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(e.target.value)}
                    placeholder="e.g. 140"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Effective Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date <span className="font-normal text-slate-400">(optional / open-ended)</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !calorieGoal || !startDate}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Set Goal Span'}
                </button>
              </div>
            </form>
          </div>

          {/* Goal History & Spans */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Recorded Goal History ({goals.length})
            </h4>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">
                No macro goals set yet. Add a target above to see dashed calorie thresholds on your trend chart.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-sm">
                {goals.map((g) => (
                  <div key={g.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {g.calorie_goal} kcal
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="font-semibold text-orange-600">
                          {g.protein_goal}g protein
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">Span:</span> {g.start_date} →{' '}
                        {g.end_date ? g.end_date : <span className="text-emerald-600 font-semibold">Active (Ongoing)</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(g.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
