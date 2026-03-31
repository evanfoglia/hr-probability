'use client';

import { useState } from 'react';
import { Calculator, Users2 } from 'lucide-react';
import PlayerSearch from './PlayerSearch';
import type { PlayerInfo } from '@/lib/mcp';

interface MatchupFormProps {
  onCalculate: (params: {
    pitcher: PlayerInfo;
    batter: PlayerInfo;
    platoonBonus: number;
  }) => void;
  loading: boolean;
}

export default function MatchupForm({ onCalculate, loading }: MatchupFormProps) {
  const [pitcher, setPitcher] = useState<PlayerInfo | null>(null);
  const [batter, setBatter] = useState<PlayerInfo | null>(null);
  const [platoonOverride, setPlatoonOverride] = useState<number | null>(null);

  const canCalculate = pitcher && batter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCalculate) return;
    onCalculate({
      pitcher,
      batter,
      platoonBonus: platoonOverride ?? 1.0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PlayerSearch
        label="Pitcher"
        value={pitcher}
        onChange={setPitcher}
      />

      <PlayerSearch
        label="Hitter"
        value={batter}
        onChange={setBatter}
      />

      {/* Platoon toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
          <Users2 className="w-3.5 h-3.5" />
          Platoon Advantage
        </label>
        <div className="flex gap-2">
          {[1.0, 1.05].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setPlatoonOverride(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                (platoonOverride ?? 1.0) === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {val === 1.0 ? 'None' : 'Yes (+5%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Calculate button */}
      <button
        type="submit"
        disabled={!canCalculate || loading}
        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="w-4 h-4" />
            Calculate HR Probability
          </>
        )}
      </button>
    </form>
  );
}
