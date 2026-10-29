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
    <div className="min-h-screen bg-slate-100/60 text-slate-800 antialiased py-6 px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="max-w-4xl mx-auto mb-6">
        <header className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">The Legendary Lock-In</h1>
              <p className="text-xs text-slate-500 font-medium">Daily Macro &amp; Calorie Tracker</p>
            </div>
          </div>
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-3.5 py-1.5 rounded-full font-bold">
            v1 Single-User
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-24 text-slate-400 font-medium">Loading diet tracker...</div>
        ) : (
          <>
            {/* Dual-Axis Macro Graph (Overlaid Calories & Protein) */}
            <DualAxisMacroChart data={timeseriesData} />

            {/* Daily Logging View */}
            <DayLogView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              dailyLog={dailyLog}
              templates={templates}
              onAddEntry={handleAddEntry}
              onDeleteEntry={handleDeleteEntry}
            />

            {/* Saved Templates Drawer / Manager */}
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
