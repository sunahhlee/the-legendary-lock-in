import React from 'react';
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

interface DualAxisMacroChartProps {
  data: DailyMacroPoint[];
}

export const DualAxisMacroChart: React.FC<DualAxisMacroChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card text-center py-8 text-gray-500">
        <p>No logged days yet. Add your first food item below to see analytics!</p>
      </div>
    );
  }

  // Format date display for chart X axis
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // 'YYYY-MM-DD' -> 'MM-DD'
    isOverCalorieGoal: d.calorie_goal != null && d.total_calories > d.calorie_goal,
  }));

  // Has any calorie goal defined in the points?
  const hasCalorieGoal = data.some((d) => d.calorie_goal != null);

  // Custom Dot renderer for calories: highlights red/crimson if over target
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Macro Trends &amp; Targets Over Time</h2>
          <p className="text-xs text-slate-500">
            Daily Calories (left axis) &amp; Daily Protein (right axis)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
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
      </div>

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

            {/* Total Calories Line with Over-Target Highlight Dots */}
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

            {/* Optional Calorie Goal Dashed Reference Line across dates (only if goal is present) */}
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
    </div>
  );
};
