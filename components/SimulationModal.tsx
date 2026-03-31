'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Dices, TrendingUp } from 'lucide-react';
import { simulateHRDistribution, getExpectedRange } from '@/lib/simulation';

interface SimulationModalProps {
  hrProb: number;
  onClose: () => void;
}

export default function SimulationModal({ hrProb, onClose }: SimulationModalProps) {
  const [result, setResult] = useState<ReturnType<typeof simulateHRDistribution> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run simulation
    const simResult = simulateHRDistribution({
      hrProb,
      numPAs: 100,
      iterations: 10000,
    });
    setResult(simResult);
    setLoading(false);
  }, [hrProb]);

  if (loading || !result) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const chartData = result.hrDistribution.map((pct, hrs) => ({ hrs, pct: pct.toFixed(1) }));
  const maxPct = Math.max(...result.hrDistribution, 1);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Dices className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Monte Carlo Simulation</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white font-mono">{result.mean.toFixed(1)}</p>
              <p className="text-sm text-slate-400">Mean HRs</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-200 font-mono">{result.median}</p>
              <p className="text-sm text-slate-400">Median</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-200 font-mono">±{result.stdDev.toFixed(1)}</p>
              <p className="text-sm text-slate-400">Std Dev</p>
            </div>
          </div>

          {/* Range */}
          <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-slate-200 font-medium">
                Expected Range: <span className="text-white font-mono">{getExpectedRange(result)}</span> HRs
              </p>
              <p className="text-sm text-slate-400">
                80% of simulations fall within this range
              </p>
            </div>
          </div>

          {/* Distribution chart */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Distribution of HRs in 100 PAs</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="hrs"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    label={{ value: 'HRs', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload?.[0]) return null;
                      return (
                        <div className="bg-slate-900 border border-slate-600 rounded px-3 py-2 shadow-lg">
                          <p className="text-slate-200 font-medium">{label} HRs</p>
                          <p className="text-slate-400 text-sm">{payload[0].value}% of simulations</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const intensity = Number(entry.pct) / maxPct;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={`rgba(239, 68, 68, ${0.3 + intensity * 0.7})`}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* P10/P90 */}
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-slate-400">10th percentile: </span>
              <span className="text-slate-200 font-mono">{result.p10} HRs</span>
            </div>
            <div>
              <span className="text-slate-400">90th percentile: </span>
              <span className="text-slate-200 font-mono">{result.p90} HRs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
