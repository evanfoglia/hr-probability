'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface MethodologyPanelProps {
  rawProb: number;
  platoonAdjusted: number;
  platoonBonus: number;
}

export default function MethodologyPanel({
  rawProb,
  platoonAdjusted,
  platoonBonus,
}: MethodologyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">Methodology</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4 text-sm">
          {/* Formula */}
          <div className="bg-slate-900 rounded-lg p-4 font-mono">
            <p className="text-slate-400 mb-2">Base Formula:</p>
            <p className="text-slate-200 text-xs">
              HR_prob = Σ (pitcher_pitch_pct × batter_ISO_vs_pitch)
            </p>
            <p className="text-slate-500 text-xs mt-1">
              ISO = SLG − BA (isolated power per plate appearance)
            </p>
          </div>

          {/* Adjustment steps */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>1. Base probability</span>
              <span className="text-slate-200 font-mono">{rawProb.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>2. × Platoon ({platoonBonus.toFixed(2)})</span>
              <span className="text-slate-200 font-mono">{platoonAdjusted.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
              <span className="text-slate-200 font-medium">Final (capped at 50%)</span>
              <span className="text-white font-mono font-bold">
                {Math.min(platoonAdjusted, 50).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Explanations */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <div>
              <p className="text-slate-300 font-medium">Pitcher Arsenal</p>
              <p className="text-slate-400 text-xs mt-1">
                Stats sourced from MLB Statcast 2024 season. BA, SLG, wOBA, Whiff%, K%, and Hard-Hit% shown for each pitch type the pitcher threw.
              </p>
            </div>
            <div>
              <p className="text-slate-300 font-medium">Recent Games</p>
              <p className="text-slate-400 text-xs mt-1">
                ERA, K%, BB%, WHIP from the last ~30 days. 10-game sample if available. Provides current hot/cold context on top of season averages.
              </p>
            </div>
            <div>
              <p className="text-slate-300 font-medium">Platoon</p>
              <p className="text-slate-400 text-xs mt-1">
                Left-handed batters vs. right-handed pitchers (and vice versa) get a +5% boost. Neutralizes when both are same-handed.
              </p>
            </div>
            <div>
              <p className="text-slate-300 font-medium">Data</p>
              <p className="text-slate-400 text-xs mt-1">
                All data from MLB Statcast via statcast-mcp. 2024 season stats.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
