import { useState, useEffect } from 'react';
import { api } from './api';
import { toLocalDateString } from './dateUtils';
import { DailyLog, FoodTemplate, DailyMacroPoint, UserGoal } from './types';
import { DayLogView } from './components/DayLogView';
import { DualAxisMacroChart, RangeOption } from './components/DualAxisMacroChart';
import { TemplateManager } from './components/TemplateManager';
import { UserGoalsModal } from './components/UserGoalsModal';
import { JournalSidebar } from './components/JournalSidebar';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper to calculate date string offset from today
const getDateNDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateString(d);
};

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(toLocalDateString());
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

  // Chart Date Range Filter State (7d default, 30d, 90d, custom)
  const [chartRange, setChartRange] = useState<RangeOption>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(getDateNDaysAgo(14));
  const [customEndDate, setCustomEndDate] = useState<string>(toLocalDateString());

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<DailyMacroPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [journalRefreshKey, setJournalRefreshKey] = useState<number>(0);

  // Sync route / path if URL changes (e.g. /users/:id or /:id)
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path && path.length > 5 && path !== 'users') {
        const cleanId = path.startsWith('users/') ? path.replace('users/', '') : path;
        setUserId(cleanId);
        setIsGoalsModalOpen(true);
      }
    };
    checkPath();

    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  const navigateToUser = (targetUserId: string) => {
    window.history.pushState({}, '', `/${targetUserId}`);
    setUserId(targetUserId);
    setIsGoalsModalOpen(true);
  };

  const handleCloseGoalsModal = () => {
    setIsGoalsModalOpen(false);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    loadTimeseries(chartRange, customStartDate, customEndDate);
    loadDailyLog(currentDate);
  };

  // Load timeseries data for the chart based on chosen range
  const loadTimeseries = async (
    rangeOpt: RangeOption = chartRange,
    cStart: string = customStartDate,
    cEnd: string = customEndDate
  ) => {
    try {
      let start: string | undefined;
      let end: string | undefined;

      const today = toLocalDateString();

      if (rangeOpt === '7d') {
        start = getDateNDaysAgo(6);
        end = today;
      } else if (rangeOpt === '30d') {
        start = getDateNDaysAgo(29);
        end = today;
      } else if (rangeOpt === '90d') {
        start = getDateNDaysAgo(89);
        end = today;
      } else if (rangeOpt === 'custom') {
        start = cStart;
        end = cEnd;
      }

      const res = await api.getTimeseries(start, end);
      setTimeseriesData(res.points);
    } catch (err) {
      console.error('Failed to load timeseries:', err);
    }
  };

  const handleRangeChange = (newRange: RangeOption, customStart?: string, customEnd?: string) => {
    setChartRange(newRange);
    if (customStart) setCustomStartDate(customStart);
    if (customEnd) setCustomEndDate(customEnd);

    loadTimeseries(
      newRange,
      customStart || customStartDate,
      customEnd || customEndDate
    );
  };

  // Load user goals
  const loadUserGoals = async (targetUserId: string) => {
    try {
      const goals = await api.getUserGoals(targetUserId);
      setUserGoals(goals);
    } catch (err) {
      console.error('Failed to load user goals:', err);
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
      await Promise.all([
        loadTemplates(),
        loadTimeseries('7d'),
        loadDailyLog(currentDate),
        loadUserGoals(userId),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadDailyLog(currentDate);
  }, [currentDate]);

  useEffect(() => {
    loadUserGoals(userId);
  }, [userId]);

  const handleAddEntry = async (
    entry: { name: string; calories: number; protein: number; grams?: number | null; template_id?: string | null },
    saveTemplate: boolean
  ) => {
    const updatedLog = await api.addMealEntry(currentDate, entry, saveTemplate);
    setDailyLog(updatedLog);
    loadTimeseries(chartRange, customStartDate, customEndDate);
    if (saveTemplate) {
      loadTemplates();
    }
  };

  const handleUpdateEntry = async (
    entryId: string,
    update: { name: string; calories: number; protein: number }
  ) => {
    await api.updateMealEntry(entryId, update);
    await loadDailyLog(currentDate);
    loadTimeseries(chartRange, customStartDate, customEndDate);
  };

  const handleSaveJournal = async (text: string) => {
    const updatedLog = await api.updateEnergyJournal(currentDate, text);
    setDailyLog(updatedLog);
    setJournalRefreshKey((k) => k + 1);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await api.deleteMealEntry(entryId);
    await loadDailyLog(currentDate);
    loadTimeseries(chartRange, customStartDate, customEndDate);
  };

  const handleCreateTemplate = async (template: {
    name: string;
    default_calories: number;
    default_protein: number;
    default_grams?: number;
    category?: string;
  }) => {
    await api.createTemplate(template);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await api.deleteTemplate(id);
    loadTemplates();
  };

  const handleSaveGoal = async (goal: {
    calorie_goal: number;
    protein_goal: number;
    start_date: string;
    end_date?: string | null;
    notes?: string | null;
  }) => {
    await api.createUserGoal(userId, goal);
    await loadUserGoals(userId);
    await loadTimeseries(chartRange, customStartDate, customEndDate);
    await loadDailyLog(currentDate);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await api.deleteUserGoal(goalId);
    await loadUserGoals(userId);
    await loadTimeseries(chartRange, customStartDate, customEndDate);
    await loadDailyLog(currentDate);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 antialiased py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full min-w-0 flex-1">
      {/* Top Header Card */}
      <div className="mb-6">
        <header className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐷</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">The Legendary Lock-In</h1>
              <p className="text-xs text-slate-500 font-medium">Daily Macro &amp; Calorie Tracker</p>
            </div>
          </div>

          {/* Clickable user macro goals pill */}
          <button
            type="button"
            onClick={() => navigateToUser(userId)}
            className="flex items-center gap-2 text-xs bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/80 text-amber-900 border border-amber-200 px-3.5 py-1.5 rounded-full font-bold transition shadow-2xs hover:shadow-xs cursor-pointer group"
            title="Click to configure user macro goals"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>v1 Single-User</span>
            <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform">⚙️</span>
          </button>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="space-y-6">
        {loading ? (
          <div className="text-center py-24 text-slate-400 font-medium">Loading diet tracker...</div>
        ) : (
          <>
            {/* Dual-Axis Macro Graph with 7d, 30d, 90d, and Custom Date Range Filter */}
            <DualAxisMacroChart
              data={timeseriesData}
              range={chartRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onRangeChange={handleRangeChange}
            />

            {/* Daily Logging View */}
            <DayLogView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              dailyLog={dailyLog}
              templates={templates}
              onAddEntry={handleAddEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onSaveJournal={handleSaveJournal}
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

      {/* Journal Sidebar: last 10 entries, filterable by date range */}
      <div className="w-full lg:w-80 shrink-0">
        <JournalSidebar refreshKey={journalRefreshKey} onSelectDate={setCurrentDate} />
      </div>
      </div>

      {/* User Goals Modal */}
      <UserGoalsModal
        userId={userId}
        isOpen={isGoalsModalOpen}
        onClose={handleCloseGoalsModal}
        goals={userGoals}
        onSaveGoal={handleSaveGoal}
        onDeleteGoal={handleDeleteGoal}
      />
    </div>
  );
}
