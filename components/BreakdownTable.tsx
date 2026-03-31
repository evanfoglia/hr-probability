'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { BreakdownRow } from '@/lib/probability';

interface BreakdownTableProps {
  breakdown: BreakdownRow[];
  totalProb: number;
}

type SortKey = 'pitcherPct' | 'hrRate' | 'contribution';

export default function BreakdownTable({ breakdown, totalProb }: BreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('contribution');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...breakdown].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const SortButton = ({ colKey, label }: { colKey: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(colKey)}
      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === colKey ? 'text-blue-400' : 'text-slate-600'}`} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 font-medium"><SortButton colKey="pitcherPct" label="Pitch Type" /></th>
            <th className="text-right py-2 font-medium"><SortButton colKey="pitcherPct" label="Pitch %" /></th>
            <th className="text-right py-2 font-medium"><SortButton colKey="hrRate" label="HR% vs Pitch" /></th>
            <th className="text-right py-2 font-medium"><SortButton colKey="contribution" label="Contribution" /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.pitch} className="border-b border-slate-700/50 hover:bg-slate-800/50">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: row.pitchColor }}
                  />
                  <span className="font-mono text-slate-200">{row.pitch}</span>
                </div>
              </td>
              <td className="text-right py-2.5 font-mono text-slate-400">{row.pitcherPct.toFixed(1)}%</td>
              <td className="text-right py-2.5 font-mono text-slate-400">{row.hrRate.toFixed(2)}%</td>
              <td className="text-right py-2.5 font-mono text-slate-200 font-medium">
                {row.contribution.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-600">
            <td className="py-2.5 font-semibold text-slate-200">TOTAL</td>
            <td className="text-right py-2.5 font-mono font-semibold text-slate-200">100%</td>
            <td className="py-2.5" />
            <td className="text-right py-2.5 font-mono font-semibold text-white text-base">
              {totalProb.toFixed(2)}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
