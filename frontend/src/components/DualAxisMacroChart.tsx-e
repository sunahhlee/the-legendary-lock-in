import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Dot,
} from 'recharts';
import { DailyMacroPoint } from '../types';

export type RangeOption = '7d' | '30d' | '90d' | 'custom';

interface DualAxisMacroChartProps {
  data: DailyMacroPoint[];
  range: RangeOption;
  customStartDate: string;
  customEndDate: string;
  onRangeChange: (range: RangeOption, customStart?: string, customEnd?: string) => void;
}

export const DualAxisMacroChart: React.FC<DualAxisMacroChartProps> = ({
  data,
  range,
  customStartDate,
  customEndDate,
  onRangeChange,
}) => {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [localStart, setLocalStart] = useState(customStartDate);
  const [localEnd, setLocalEnd] = useState(customEndDate);

  const handleCustomClick = () => {
    setIsCustomModalOpen(true);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStart && localEnd) {
      onRangeChange('custom', localStart, localEnd);
      setIsCustomModalOpen(false);
    }
  };

  // Format date display for chart X axis
  const formattedData = (data || []).map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // 'YYYY-MM-DD' -> 'MM-DD'
    isOverCalorieGoal: d.calorie_goal != null && d.total_calories > d.calorie_goal,
    // Stacked area helpers: transparent base up to the limit, red band for the surplus above it
    surplusBase: d.calorie_goal != null ? Math.min(d.total_calories, d.calorie_goal) : null,
    surplus: d.calorie_goal != null ? Math.max(0, d.total_calories - d.calorie_goal) : null,
  }));

  const hasCalorieGoal = (data || []).some((d) => d.calorie_goal != null);

  const renderCalorieDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isOver = payload && payload.isOverCalorieGoal;

    if (isOver) {
      return (
        <svg key={`dot-${payload.date}`}>
          <circle cx={cx} cy={cy} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
        </svg>
      );
    }

    return (
      <Dot key={`dot-${payload.date}`} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
    );
  };

  const renderLimitMarker = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload || payload.calorie_goal == null) return <g key={`limit-${props.index}`} />;
    return (
      <line
        key={`limit-${payload.date}`}
        x1={cx - 30}
        x2={cx + 30}
        y1={cy}
        y2={cy}
        stroke="#f87171"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
    );
  };

  return (
    <div className="card shadow-md rounded-2xl p-6 bg-white border border-slate-200/80 mb-6 text-left relative">
      {/* Chart Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Macro Trends &amp; Targets Over Time</h2>
          <p className="text-xs text-slate-500">
            Daily Calories (left axis) &amp; Daily Protein (right axis)
          </p>
        </div>

        {/* Stable Date Range Selector Pills (Doesn't shift!) */}
        <div className="flex items-center gap-2 relative">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setIsCustomModalOpen(false);
                onRangeChange('7d');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                range === '7d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomModalOpen(false);
                onRangeChange('30d');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                range === '30d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomModalOpen(false);
                onRangeChange('90d');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                range === '90d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              onClick={handleCustomClick}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                range === 'custom'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom {range === 'custom' && '✓'}
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Status Indicators */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mb-4">
        <span className="flex items-center gap-1.5 text-blue-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          Calories (kcal)
        </span>
        <span className="flex items-center gap-1.5 text-green-700">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
          Protein (g)
        </span>
        {hasCalorieGoal && (
          <>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-4 border-t-2 border-dashed border-red-400 inline-block"></span>
              Calorie Limit
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500 inline-block"></span>
              Calorie Surplus
            </span>
          </>
        )}
      </div>

      {(!data || data.length === 0) ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          No logged days found within the selected date range.
        </div>
      ) : (
        <div style={{ width: '100%', height: 520 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={formattedData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayDate"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              {/* Left Y-Axis: Calories */}
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#2563eb"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#dbeafe' }}
                domain={[0, 'auto']}
                unit=" kcal"
              />
              {/* Right Y-Axis: Protein */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#16a34a"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#dcfce7' }}
                domain={[0, 'auto']}
                unit="g"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '10px 14px',
                }}
                formatter={(value: any, name: any, item: any) => {
                  if (name === 'Calories') {
                    const goal = item.payload.calorie_goal;
                    const suffix = goal
                      ? value > goal
                        ? ` (⚠️ +${Math.round(value - goal)} kcal over limit)`
                        : ` (✅ within ${goal} limit)`
                      : '';
                    return [`${Number(value).toLocaleString()} kcal${suffix}`, name];
                  }
                  if (name === 'Protein') {
                    const proteinGoal = item.payload.protein_goal;
                    const suffix =
                      proteinGoal != null && value < proteinGoal
                        ? ` (⚠️ ${Math.round((proteinGoal - value) * 10) / 10}g short of ${proteinGoal}g goal)`
                        : '';
                    return [`${value}g${suffix}`, name];
                  }
                  if (name === 'Calorie Limit') return [`${Number(value).toLocaleString()} kcal`, name];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36} />

              {/* Calorie surplus bar: transparent up to the limit, red above it (works for a single day) */}
              {hasCalorieGoal && (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="surplusBase"
                    stackId="surplus"
                    fill="transparent"
                    legendType="none"
                    tooltipType="none"
                    barSize={48}
                    isAnimationActive={false}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="surplus"
                    stackId="surplus"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    legendType="none"
                    tooltipType="none"
                    barSize={48}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Total Calories Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_calories"
                name="Calories"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={renderCalorieDot}
                activeDot={{ r: 7 }}
              />

              {/* Total Protein Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total_protein"
                name="Protein"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />

              {/* Optional Calorie Goal Dashed Line */}
              {hasCalorieGoal && (
                <Line
                  yAxisId="left"
                  type="stepAfter"
                  dataKey="calorie_goal"
                  name="Calorie Limit"
                  stroke="#f87171"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={renderLimitMarker}
                  activeDot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Small Popup Modal for Custom Date Range */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm text-left animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">Select Custom Date Range</h4>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
