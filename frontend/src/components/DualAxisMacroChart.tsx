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
  }));

  return (
    <div className="card shadow-md rounded-xl p-5 bg-white border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Macro Trends Over Time</h2>
          <p className="text-sm text-gray-500">
            Daily Calories (left axis) &amp; Daily Protein (right axis)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            Calories (kcal)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span>
            Protein (g)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            {/* Left Y-Axis: Calories */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#f59e0b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#fde68a' }}
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
              axisLine={{ stroke: '#fed7aa' }}
              domain={[0, 'auto']}
              unit="g"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'Calories') return [`${Number(value).toLocaleString()} kcal`, name];
                if (name === 'Protein') return [`${value}g`, name];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_calories"
              name="Calories"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f59e0b' }}
              activeDot={{ r: 6 }}
            />
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
