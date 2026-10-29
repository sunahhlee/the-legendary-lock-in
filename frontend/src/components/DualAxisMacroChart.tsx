import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
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
  const [localStart, setLocalStart] = useState(customStartDate);
  const [localEnd, setLocalEnd] = useState(customEndDate);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStart && localEnd) {
      onRangeChange('custom', localStart, localEnd);
    }
  };

  // Format date display for chart X axis
  const formattedData = (data || []).map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // 'YYYY-MM-DD' -> 'MM-DD'
    isOverCalorieGoal: d.calorie_goal != null && d.total_calories > d.calorie_goal,
  }));

  const hasCalorieGoal = (data || []).some((d) => d.calorie_goal != null);

  const renderCalorieDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isOver = payload && payload.isOverCalorieGoal;

    if (isOver) {
      return (
        <svg key={`dot-${payload.date}`}>
          <circle cx={cx} cy={cy} r={6} fill="#dc2626" stroke="#ffffff" strokeWidth={2} />
        </svg>
      );
    }

    return (
      <Dot key={`dot-${payload.date}`} cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
    );
  };

  return (
    <div className="card shadow-md rounded-2xl p-6 bg-white border border-slate-200/80 mb-6 text-left">
      {/* Chart Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Macro Trends &amp; Targets Over Time</h2>
          <p className="text-xs text-slate-500">
            Daily Calories (left axis) &amp; Daily Protein (right axis)
          </p>
        </div>

        {/* Date Range Selector Pills & Custom Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => onRangeChange('7d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                range === '7d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => onRangeChange('30d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                range === '30d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => onRangeChange('90d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                range === '90d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              onClick={() => onRangeChange('custom', localStart, localEnd)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                range === 'custom'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {range === 'custom' && (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                required
                className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                required
                className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Legend & Status Indicators */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mb-4">
        <span className="flex items-center gap-1.5 text-amber-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          Calories (kcal)
        </span>
        <span className="flex items-center gap-1.5 text-orange-700">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span>
          Protein (g)
        </span>
        {hasCalorieGoal && (
          <>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-4 border-t-2 border-dashed border-red-400 inline-block"></span>
              Calorie Limit
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
              Over Limit
            </span>
          </>
        )}
      </div>

      {(!data || data.length === 0) ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          No logged days found within the selected date range.
        </div>
      ) : (
        <div style={{ width: '100%', height: 340 }}>
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
                stroke="#d97706"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#fef3c7' }}
                domain={[0, 'auto']}
                unit=" kcal"
              />
              {/* Right Y-Axis: Protein */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ea580c"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#ffedd5' }}
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
                  if (name === 'Protein') return [`${value}g`, name];
                  if (name === 'Calorie Limit') return [`${Number(value).toLocaleString()} kcal`, name];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36} />

              {/* Total Calories Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_calories"
                name="Calories"
                stroke="#f59e0b"
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
                stroke="#ea580c"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ea580c' }}
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
                  dot={false}
                  activeDot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
