import { useState, useEffect } from 'react';
import { api } from './api';
import { DailyLog, FoodTemplate, DailyMacroPoint } from './types';
import { DayLogView } from './components/DayLogView';
import { DualAxisMacroChart } from './components/DualAxisMacroChart';
import { TemplateManager } from './components/TemplateManager';

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<DailyMacroPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load timeseries data for the chart
  const loadTimeseries = async () => {
    try {
      const res = await api.getTimeseries();
      setTimeseriesData(res.points);
    } catch (err) {
      console.error('Failed to load timeseries:', err);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      const tpls = await api.getTemplates();
      setTemplates(tpls);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // Load daily log for active date
  const loadDailyLog = async (date: string) => {
    try {
      const log = await api.getDailyLog(date);
      setDailyLog(log);
    } catch (err) {
      console.error('Failed to load daily log:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadTemplates(), loadTimeseries(), loadDailyLog(currentDate)]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadDailyLog(currentDate);
  }, [currentDate]);

  const handleAddEntry = async (
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveTemplate: boolean
  ) => {
    const updatedLog = await api.addMealEntry(currentDate, entry, saveTemplate);
    setDailyLog(updatedLog);
    // Refresh chart and templates if saved
    loadTimeseries();
    if (saveTemplate) {
      loadTemplates();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    await api.deleteMealEntry(entryId);
    await loadDailyLog(currentDate);
    loadTimeseries();
  };

  const handleCreateTemplate = async (template: {
    name: string;
    default_calories: number;
    default_protein: number;
    category?: string;
  }) => {
    await api.createTemplate(template);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await api.deleteTemplate(id);
    loadTemplates();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">The Legendary Lock-In</h1>
              <p className="text-xs text-slate-500 font-medium">Daily Macro &amp; Calorie Tracker</p>
            </div>
          </div>
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full font-semibold">
            v1 Single-User
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading your diet tracker...</div>
        ) : (
          <>
            {/* Dual-Axis Macro Graph (Overlaid Calories & Protein) */}
            <DualAxisMacroChart data={timeseriesData} />

            {/* Daily Logging View (Entries table, totals, quick add) */}
            <DayLogView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              dailyLog={dailyLog}
              templates={templates}
              onAddEntry={handleAddEntry}
              onDeleteEntry={handleDeleteEntry}
            />

            {/* Template Manager */}
            <TemplateManager
              templates={templates}
              onCreateTemplate={handleCreateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </>
        )}
      </main>
    </div>
  );
}
