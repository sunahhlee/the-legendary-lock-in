import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { DailyLog, FoodTemplate, DailyMacroPoint, UserGoal } from './types';
import { DayLogView } from './components/DayLogView';
import { DualAxisMacroChart, RangeOption } from './components/DualAxisMacroChart';
import { TemplateManager } from './components/TemplateManager';
import { UserGoalsModal } from './components/UserGoalsModal';
import { LoginPage } from './components/LoginPage';

const getDateNDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

  const [chartRange, setChartRange] = useState<RangeOption>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(getDateNDaysAgo(14));
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<DailyMacroPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // User menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setEditingUsername(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load username from /api/me once authenticated
  useEffect(() => {
    if (!user) return;
    fetch(`/api/me?email=${encodeURIComponent(user.email ?? '')}`, {
      headers: { Authorization: `Bearer ${(user as any).access_token ?? ''}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.username) setUsername(data.username); })
      .catch(() => {});
  }, [user]);

  const loadTimeseries = async (
    rangeOpt: RangeOption = chartRange,
    cStart: string = customStartDate,
    cEnd: string = customEndDate
  ) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      let start: string | undefined;
      let end: string | undefined;

      if (rangeOpt === '7d') { start = getDateNDaysAgo(6); end = today; }
      else if (rangeOpt === '30d') { start = getDateNDaysAgo(29); end = today; }
      else if (rangeOpt === '90d') { start = getDateNDaysAgo(89); end = today; }
      else if (rangeOpt === 'custom') { start = cStart; end = cEnd; }

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
    loadTimeseries(newRange, customStart || customStartDate, customEnd || customEndDate);
  };

  const loadUserGoals = async () => {
    if (!user) return;
    try {
      const goals = await api.getUserGoals(user.id);
      setUserGoals(goals);
    } catch (err) {
      console.error('Failed to load user goals:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const tpls = await api.getTemplates();
      setTemplates(tpls);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadDailyLog = async (date: string) => {
    try {
      const log = await api.getDailyLog(date);
      setDailyLog(log);
    } catch (err) {
      console.error('Failed to load daily log:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadTimeseries('7d'),
        loadDailyLog(currentDate),
        loadUserGoals(),
      ]);
      setLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (user) loadDailyLog(currentDate);
  }, [currentDate]);

  const handleAddEntry = async (
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveTemplate: boolean
  ) => {
    const updatedLog = await api.addMealEntry(currentDate, entry, saveTemplate);
    setDailyLog(updatedLog);
    loadTimeseries(chartRange, customStartDate, customEndDate);
    if (saveTemplate) loadTemplates();
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
  }) => {
    if (!user) return;
    await api.createUserGoal(user.id, goal);
    await loadUserGoals();
    await loadTimeseries(chartRange, customStartDate, customEndDate);
    await loadDailyLog(currentDate);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await api.deleteUserGoal(goalId);
    await loadUserGoals();
    await loadTimeseries(chartRange, customStartDate, customEndDate);
    await loadDailyLog(currentDate);
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    try {
      await api.updateUsername(trimmed);
      setUsername(trimmed);
      setEditingUsername(false);
      setUserMenuOpen(false);
    } catch (err) {
      console.error('Failed to update username:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center text-slate-400 font-medium">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const displayName = username || user.email?.split('@')[0] || 'You';

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 antialiased py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-6">
        <header className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">The Legendary Lock-In</h1>
              <p className="text-xs text-slate-500 font-medium">Daily Macro &amp; Calorie Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Goals pill */}
            <button
              type="button"
              onClick={() => setIsGoalsModalOpen(true)}
              className="flex items-center gap-2 text-xs bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/80 text-amber-900 border border-amber-200 px-3.5 py-1.5 rounded-full font-bold transition shadow-2xs hover:shadow-xs cursor-pointer group"
              title="Configure macro goals"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Goals</span>
              <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform">⚙️</span>
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(o => !o); setEditingUsername(false); }}
                className="flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer"
                title="User menu"
              >
                <span className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {displayName[0].toUpperCase()}
                </span>
                <span>{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  {editingUsername ? (
                    <div className="px-3 py-2 space-y-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="New username"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveUsername}
                          className="flex-1 text-xs bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-1.5 rounded-lg transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUsername(false)}
                          className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-1.5 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setUsernameInput(username || ''); setEditingUsername(true); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        ✏️ Edit username
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={signOut}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                      >
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-24 text-slate-400 font-medium">Loading diet tracker...</div>
        ) : (
          <>
            <DualAxisMacroChart
              data={timeseriesData}
              range={chartRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onRangeChange={handleRangeChange}
            />
            <DayLogView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              dailyLog={dailyLog}
              templates={templates}
              onAddEntry={handleAddEntry}
              onDeleteEntry={handleDeleteEntry}
            />
            <TemplateManager
              templates={templates}
              onCreateTemplate={handleCreateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </>
        )}
      </main>

      <UserGoalsModal
        userId={user.id}
        isOpen={isGoalsModalOpen}
        onClose={() => {
          setIsGoalsModalOpen(false);
          loadTimeseries(chartRange, customStartDate, customEndDate);
          loadDailyLog(currentDate);
        }}
        goals={userGoals}
        onSaveGoal={handleSaveGoal}
        onDeleteGoal={handleDeleteGoal}
      />
    </div>
  );
}
