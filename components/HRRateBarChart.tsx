'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { BatterHRRate } from '@/lib/mcp';
import { getPitchColor, normalizePitchName } from '@/lib/probability';

interface HRRateBarChartProps {
  data: BatterHRRate[];
}

export default function HRRateBarChart({ data }: HRRateBarChartProps) {
  const chartData = data
    .map((d) => ({
      name: normalizePitchName(d.pitch),
      hr_pct: d.hr_pct,
      color: getPitchColor(normalizePitchName(d.pitch)),
    }))
    .sort((a, b) => b.hr_pct - a.hr_pct);

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            width={45}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.[0]) return null;
              return (
                <div className="bg-slate-800 border border-slate-600 rounded px-3 py-2 shadow-lg">
                  <p className="text-slate-200 font-medium">{label}</p>
                  <p className="text-slate-400 text-sm">
                    HR Rate: <span className="text-white font-mono">{Number(payload[0].value).toFixed(2)}%</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="hr_pct" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
