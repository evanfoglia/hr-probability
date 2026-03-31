'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PitcherArsenal } from '@/lib/mcp';
import { getPitchColor, normalizePitchName } from '@/lib/probability';

interface ArsenalPieChartProps {
  data: PitcherArsenal[];
}

export default function ArsenalPieChart({ data }: ArsenalPieChartProps) {
  const chartData = data.map((d) => ({
    name: normalizePitchName(d.pitch),
    value: d.pct,
    color: getPitchColor(normalizePitchName(d.pitch)),
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-slate-800 border border-slate-600 rounded px-3 py-2 shadow-lg">
                  <p className="text-slate-200 font-medium">{d.name}</p>
                  <p className="text-slate-400 text-sm">{d.value.toFixed(1)}% of arsenal</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
