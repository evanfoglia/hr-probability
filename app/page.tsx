'use client';

import { useState, useCallback } from 'react';
import { CircleDot } from 'lucide-react';
import MatchupForm from '@/components/MatchupForm';
import ResultsPanel from '@/components/ResultsPanel';
import type { PlayerInfo } from '@/lib/mcp';
import type { PitcherData, BatterData } from '@/lib/mcp';
import type { ProbabilityResult } from '@/lib/probability';
import { computeHRProbability } from '@/lib/probability';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pitcherData, setPitcherData] = useState<PitcherData | null>(null);
  const [batterData, setBatterData] = useState<BatterData | null>(null);
  const [result, setResult] = useState<ProbabilityResult | null>(null);
  const [platoonBonus, setPlatoonBonus] = useState(1.0);

  const handleCalculate = useCallback(async (params: {
    pitcher: PlayerInfo;
    batter: PlayerInfo;
    platoonBonus: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch pitcher and batter data in parallel
      const [pitcherRes, batterRes] = await Promise.all([
        fetch('/api/pitcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: params.pitcher.name }),
        }),
        fetch('/api/batter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: params.batter.name }),
        }),
      ]);

      if (!pitcherRes.ok) {
        const err = await pitcherRes.json();
        throw new Error(err.error || 'Failed to fetch pitcher data');
      }
      if (!batterRes.ok) {
        const err = await batterRes.json();
        throw new Error(err.error || 'Failed to fetch batter data');
      }

      const pitcherData: PitcherData = await pitcherRes.json();
      const batterData: BatterData = await batterRes.json();

      if (!pitcherData.arsenal || pitcherData.arsenal.length === 0) {
        throw new Error(`${params.pitcher.name} — no 2024 pitch data found (may not have pitched recently, e.g. due to injury). Try a different pitcher.`);
      }
      if (!batterData.hr_rates || batterData.hr_rates.length === 0) {
        throw new Error(`${params.batter.name} — no 2024 batting data found. Try a different hitter.`);
      }

      setPlatoonBonus(params.platoonBonus);

      const probResult = computeHRProbability(
        pitcherData.arsenal,
        batterData.hr_rates,
        { platoonBonus: params.platoonBonus }
      );

      setPitcherData(pitcherData);
      setBatterData(batterData);
      setResult(probResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
      setPitcherData(null);
      setBatterData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">HR Probability Calculator</h1>
              <p className="text-xs text-slate-400">MLB Statcast · Real-time matchup analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Matchup Form */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200 mb-5">Matchup Selection</h2>
            <MatchupForm onCalculate={handleCalculate} loading={loading} />
          </div>

          {/* Right: Results Panel */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200 mb-5">Results</h2>
            <ResultsPanel
              pitcherData={pitcherData}
              batterData={batterData}
              result={result}
              platoonBonus={platoonBonus}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-slate-500">
            Data sourced from MLB Statcast · Probabilities are estimates based on historical data
          </p>
        </div>
      </footer>
    </div>
  );
}
