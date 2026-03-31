'use client';

import { useState } from 'react';
import { Dices, AlertCircle, CircleDot, TrendingUp, Activity, Target } from 'lucide-react';
import BreakdownTable from './BreakdownTable';
import ArsenalPieChart from './ArsenalPieChart';
import HRRateBarChart from './HRRateBarChart';
import SimulationModal from './SimulationModal';
import MethodologyPanel from './MethodologyPanel';
import type { ProbabilityResult } from '@/lib/probability';
import type { PitcherData, BatterData, PitchTypeStats } from '@/lib/mcp';
import { getHRProbColor, getHRProbLabel } from '@/lib/probability';

interface ResultsPanelProps {
  pitcherData: PitcherData | null;
  batterData: BatterData | null;
  result: ProbabilityResult | null;
  platoonBonus: number;
  loading: boolean;
  error: string | null;
}

function PitcherArsenalCard({ arsenal_full, recent }: { arsenal_full: PitchTypeStats[]; recent: PitcherData['recent'] }) {
  if (!arsenal_full || arsenal_full.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-slate-400 text-sm">No arsenal data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      {/* Header with recent stats */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-slate-200">Pitcher Arsenal · 2024 Season</h3>
        </div>
        {recent && (
          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
            <div className="bg-slate-700/50 rounded-lg py-1.5 px-1">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">ERA</p>
              <p className="text-slate-100 font-mono font-medium">{recent.era.toFixed(2)}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg py-1.5 px-1">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">K%</p>
              <p className="text-green-400 font-mono font-medium">{recent.k_pct.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg py-1.5 px-1">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">BB%</p>
              <p className="text-red-400 font-mono font-medium">{recent.bb_pct.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg py-1.5 px-1">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">WHIP</p>
              <p className="text-slate-100 font-mono font-medium">{recent.whip.toFixed(2)}</p>
            </div>
          </div>
        )}
        {recent && (
          <p className="text-[10px] text-slate-500 text-center">
            Recent: {recent.date_range} · {recent.games} games · {recent.ip.toFixed(1)} IP
          </p>
        )}
      </div>

      {/* Arsenal breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 px-3 font-medium uppercase tracking-wider text-[10px]">Pitch</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">%</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">PA</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">BA</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">SLG</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">wOBA</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">Whiff%</th>
              <th className="text-right py-2 px-2 font-medium uppercase tracking-wider text-[10px]">K%</th>
              <th className="text-right py-2 px-3 font-medium uppercase tracking-wider text-[10px]">Hard%</th>
            </tr>
          </thead>
          <tbody>
            {arsenal_full.map((pitch, i) => {
              const barWidth = (pitch.pct / arsenal_full[0].pct) * 100;
              return (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="py-2 px-3">
                    <span className="text-slate-200 font-medium text-[11px]">{pitch.pitch_name}</span>
                    <div className="mt-0.5 h-1 bg-slate-700 rounded-full overflow-hidden w-16">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="text-right py-2 px-2 text-slate-100 font-mono">{pitch.pct.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-slate-400 font-mono">{pitch.pa}</td>
                  <td className={`text-right py-2 px-2 font-mono ${pitch.ba > 0.3 ? 'text-red-400' : pitch.ba > 0.2 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pitch.ba.toFixed(3)}
                  </td>
                  <td className={`text-right py-2 px-2 font-mono ${pitch.slg > 0.5 ? 'text-red-400' : pitch.slg > 0.3 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pitch.slg.toFixed(3)}
                  </td>
                  <td className={`text-right py-2 px-2 font-mono ${pitch.woba > 0.4 ? 'text-red-400' : pitch.woba > 0.3 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pitch.woba.toFixed(3)}
                  </td>
                  <td className="text-right py-2 px-2 text-cyan-400 font-mono">{pitch.whiff_pct.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-green-400 font-mono">{pitch.k_pct.toFixed(1)}%</td>
                  <td className={`text-right py-2 px-3 font-mono ${pitch.hard_hit_pct > 50 ? 'text-red-400' : pitch.hard_hit_pct > 35 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pitch.hard_hit_pct.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 bg-slate-800/50 flex gap-4 text-[10px] text-slate-500">
        <span>BA/SLG/wOBA: <span className="text-green-400">■</span> good → <span className="text-red-400">■</span> bad</span>
        <span>Whiff%: swings & misses</span>
        <span>K%: strikeout rate</span>
        <span>Hard%: hard-hit contact</span>
      </div>
    </div>
  );
}

export default function ResultsPanel({
  pitcherData,
  batterData,
  result,
  platoonBonus,
  loading,
  error,
}: ResultsPanelProps) {
  const [showSimModal, setShowSimModal] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 font-medium">{error}</p>
        <p className="text-slate-400 text-sm mt-2">Try again or adjust your matchup selection.</p>
      </div>
    );
  }

  if (!result || !pitcherData || !batterData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CircleDot className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400">Select a pitcher and hitter to see HR probability</p>
      </div>
    );
  }

  const hrColor = getHRProbColor(result.hrProb);
  const hrLabel = getHRProbLabel(result.hrProb);

  return (
    <div className="space-y-5">
      {/* Hero number */}
      <div className="bg-slate-800 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="w-5 h-5 text-slate-400" />
          <p className="text-sm text-slate-400 uppercase tracking-wider">HR Probability</p>
        </div>
        <p className="text-6xl font-bold font-mono mb-2" style={{ color: hrColor }}>
          {result.hrProb.toFixed(1)}%
        </p>
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${hrColor}20`, color: hrColor }}
        >
          {hrLabel} Risk
        </span>
        {platoonBonus > 1 && (
          <p className="text-xs text-slate-500 mt-2">+5% platoon advantage applied</p>
        )}
      </div>

      {/* Pitcher's full arsenal — THE main feature */}
      <PitcherArsenalCard
        arsenal_full={pitcherData.arsenal_full}
        recent={pitcherData.recent}
      />

      {/* HR Probability breakdown */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          HR Probability Breakdown
        </h3>
        <BreakdownTable breakdown={result.breakdown} totalProb={result.hrProb} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5">
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Pitch Mix</h3>
          <ArsenalPieChart data={pitcherData.arsenal} />
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Hitter HR Rate vs. Pitch Type</h3>
          <HRRateBarChart data={batterData.hr_rates} />
        </div>
      </div>

      {/* Simulate button */}
      <button
        onClick={() => setShowSimModal(true)}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Dices className="w-4 h-4" />
        Simulate 100 Plate Appearances
      </button>

      <MethodologyPanel
        rawProb={result.rawProb}
        platoonAdjusted={result.platoonAdjusted}
        platoonBonus={platoonBonus}
      />

      {showSimModal && (
        <SimulationModal hrProb={result.hrProb} onClose={() => setShowSimModal(false)} />
      )}
    </div>
  );
}
