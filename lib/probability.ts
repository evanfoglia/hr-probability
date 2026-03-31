// lib/probability.ts - HR probability calculation

import type { PitcherArsenal, BatterHRRate } from './mcp';

export interface ProbabilityOptions {
  platoonBonus: number;
}

export interface ProbabilityResult {
  hrProb: number;
  breakdown: BreakdownRow[];
  rawProb: number;
  platoonAdjusted: number;
}

export interface BreakdownRow {
  pitch: string;
  pitcherPct: number;
  hrRate: number;
  contribution: number;
  pitchColor: string;
}

const PITCH_COLORS: Record<string, string> = {
  'FF': '#ef4444',   // 4-seam fastball - red
  '4-Seam Fastball': '#ef4444',
  'SI': '#f97316',   // sinker - orange
  'Sinker': '#f97316',
  'SL': '#3b82f6',   // slider - blue
  'Slider': '#3b82f6',
  'CH': '#22c55e',   // changeup - green
  'Changeup': '#22c55e',
  'CB': '#a855f7',   // curveball - purple
  'Curveball': '#a855f7',
  'KC': '#ec4899',   // knuckle curve - pink
  'Knuckle Curve': '#ec4899',
  'SW': '#eab308',   // sweeper - yellow
  'Sweeper': '#eab308',
  'ST': '#06b6d4',   // splitter - cyan
  'Splitter': '#06b6d4',
  'CS': '#84cc16',   // cutter - lime
  'Cutter': '#84cc16',
};

export function getPitchColor(pitch: string): string {
  // Try exact match first
  if (PITCH_COLORS[pitch]) return PITCH_COLORS[pitch];
  // Try contains match
  const lower = pitch.toLowerCase();
  if (lower.includes('fastball') || lower === 'ff') return PITCH_COLORS['FF'];
  if (lower.includes('sinker')) return PITCH_COLORS['SI'];
  if (lower.includes('slider')) return PITCH_COLORS['SL'];
  if (lower.includes('changeup') || lower.includes('change')) return PITCH_COLORS['CH'];
  if (lower.includes('curveball') || lower.includes('curve')) return PITCH_COLORS['CB'];
  if (lower.includes('knuckle') || lower.includes('kc')) return PITCH_COLORS['KC'];
  if (lower.includes('sweeper') || lower.includes('sw')) return PITCH_COLORS['SW'];
  if (lower.includes('splitter') || lower.includes('st')) return PITCH_COLORS['ST'];
  if (lower.includes('cutter') || lower.includes('cs')) return PITCH_COLORS['CS'];
  // Default gray
  return '#64748b';
}

export function normalizePitchName(pitch: string): string {
  const lower = pitch.toLowerCase();
  if (lower.includes('4-seam') || lower === 'ff' || lower.includes('fastball')) return 'FF';
  if (lower.includes('sinker') || lower === 'si') return 'SI';
  if (lower.includes('slider') || lower === 'sl') return 'SL';
  if (lower.includes('changeup') || lower.includes('change') || lower === 'ch') return 'CH';
  if (lower.includes('curveball') || lower.includes('curve') || lower === 'cb') return 'CB';
  if (lower.includes('knuckle')) return 'KC';
  if (lower.includes('sweeper')) return 'SW';
  if (lower.includes('splitter')) return 'ST';
  if (lower.includes('cutter')) return 'CS';
  return pitch;
}

export function computeHRProbability(
  pitcherArsenal: PitcherArsenal[],
  batterHRRates: BatterHRRate[],
  options: ProbabilityOptions
): ProbabilityResult {
  // Build lookup map for batter HR rates by normalized pitch name
  const hrRateMap = new Map<string, number>();
  for (const stat of batterHRRates) {
    hrRateMap.set(normalizePitchName(stat.pitch), stat.hr_pct);
  }

  let hrProb = 0;
  const breakdown: BreakdownRow[] = [];

  for (const { pitch, pct } of pitcherArsenal) {
    const normalized = normalizePitchName(pitch);
    const hrRate = hrRateMap.get(normalized) ?? 0.5; // fallback to 0.5% for unseen pitches
    const contribution = (pct / 100) * (hrRate / 100);
    hrProb += contribution;
    breakdown.push({
      pitch: normalized,
      pitcherPct: pct,
      hrRate,
      contribution: contribution * 100, // convert to percentage points
      pitchColor: getPitchColor(normalized),
    });
  }

  // Sort by contribution descending
  breakdown.sort((a, b) => b.contribution - a.contribution);

  const rawProb = hrProb * 100;
  // Apply platoon bonus
  const platoonAdjusted = rawProb * options.platoonBonus;
  // Cap at 50%
  const hrProbFinal = Math.min(platoonAdjusted, 50);

  return {
    hrProb: hrProbFinal,
    breakdown,
    rawProb,
    platoonAdjusted,
  };
}

export function getHRProbColor(prob: number): string {
  if (prob > 5) return '#ef4444'; // red-500
  if (prob >= 2) return '#f97316'; // orange-500
  return '#64748b'; // slate-500
}

export function getHRProbLabel(prob: number): string {
  if (prob > 5) return 'High';
  if (prob >= 2) return 'Moderate';
  return 'Low';
}
