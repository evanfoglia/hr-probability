// lib/mcp.ts - mcporter CLI wrapper for statcast-mcp

export interface PlayerInfo {
  name: string;
  team: string;
  position: string;
  id: number;
  handedness?: string;
}

export interface PitchTypeStats {
  pitch_type: string;
  pitch_name: string;
  pct: number;
  pa: number;
  ba: number;
  slg: number;
  woba: number;
  whiff_pct: number;
  k_pct: number;
  est_ba: number;
  est_slg: number;
  est_woba: number;
  hard_hit_pct: number;
  run_value: number;
  pitches: number;
}

export interface RecentPitcherStats {
  era: number;
  k_pct: number;
  bb_pct: number;
  hr_pct: number;
  whip: number;
  ip: number;
  games: number;
  date_range: string;
}

export interface PitcherData {
  recent: RecentPitcherStats | null;
  arsenal: { pitch: string; pct: number }[];
  arsenal_full: PitchTypeStats[];
  season_stats: {
    era: number;
    k_pct: number;
    bb_pct: number;
    hr_pct: number;
    whip: number;
  };
}

export interface BatterHRRate {
  pitch: string;
  hr_pct: number;
  barrel_pct: number;
  avg_exit_velo: number;
  swings_and_misses: number;
}

export interface BatterData {
  hr_rates: BatterHRRate[];
  expected_stats: {
    avg: number;
    obp: number;
    slg: number;
    hr_total: number;
  };
}

// Parse mcporter's markdown table output into an array of objects
function parseTableWithHeader(output: string): Record<string, string | number>[] {
  const allLines = output.trim().split('\n');
  const lines: string[] = [];
  let foundTable = false;

  for (const l of allLines) {
    const trimmed = l.trim();
    if (!trimmed) continue;
    if (/^\d+ rows? returned[\.:]?\s*$/i.test(trimmed)) continue;
    if (!l.includes('|')) continue;
    const cells = l.split('|').slice(1, -1).map(c => c.trim());
    const isAlignment = cells.length > 0 && cells.every(c => /^[\s:-]+$/.test(c));
    if (!foundTable && !isAlignment) foundTable = true;
    if (!foundTable) continue;
    lines.push(l);
  }

  if (lines.length < 1) return [];

  const headerLine = lines[0];
  let dataStartIdx = 1;
  while (dataStartIdx < lines.length) {
    const cells = lines[dataStartIdx].split('|').slice(1, -1).map(c => c.trim());
    if (cells.length > 0 && cells.every(c => /^[\s:-]+$/.test(c))) { dataStartIdx++; continue; }
    break;
  }

  const headers = headerLine.split('|').map(h =>
    h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  ).filter(h => h.length > 0);

  const results: Record<string, string | number>[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('|')) continue;
    const values = line.split('|').map(v => v.trim()).filter(v => v.length > 0);
    if (values.length === 0) continue;
    const row: Record<string, string | number> = {};
    headers.forEach((h, idx) => {
      const v = values[idx] ?? '';
      if (v === 'nan' || v === 'na' || v === '-' || v === '') { row[h] = 0; return; }
      if (/^-?\d+$/.test(v)) { row[h] = parseInt(v, 10); return; }
      if (/^-?\d+\.\d+$/.test(v)) { row[h] = parseFloat(v); return; }
      row[h] = v;
    });
    results.push(row);
  }
  return results;
}

// For Node.js environment (Next.js API routes)
function execMcporterNode(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(command, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: '/Users/evanfoglia/.openclaw/workspace',
    }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) reject(new Error(`mcporter failed: ${stderr || error.message}`));
      else resolve(stdout);
    });
  });
}

export async function playerLookup(name: string): Promise<PlayerInfo[]> {
  try {
    const ql = name.toLowerCase().trim();
    const words = ql.split(' ');

    // Always search with the full query — statcast does substring matching
    const command = `mcporter call statcast player_lookup 'player_name=${ql}' 2>&1`;
    const output = await execMcporterNode(command);
    const rows = parseTableWithHeader(output);

    const players = rows.map(row => ({
      name: `${row.name_first} ${row.name_last}`.trim().replace(/\b\w/g, c => c.toUpperCase()),
      team: (row.team || '') as string,
      position: (row.position || '') as string,
      id: row.key_mlbam as number,
    })).filter(p => p.id > 0); // drop records with invalid IDs

    // Score: lower = better
    // 0 = exact match
    // 1 = query starts name (e.g., "Shohei O" starts "Shohei Ohtani")
    // 2 = first word starts a name part (e.g., "Shohei" starts "Shohei" in "Shohei Ohtani")
    // 3 = other substring match (e.g., "Shohei" in "Ernie Shore")
    function score(p: typeof players[0]): number {
      const nl = p.name.toLowerCase();
      if (nl === ql) return 0;
      if (nl.startsWith(ql)) return 1;
      // Check if any name part starts with any query word
      const nameParts = nl.split(' ');
      const firstWordMatch = words.some(w => nameParts.some(np => np.startsWith(w)));
      if (firstWordMatch) return 2;
      return 3;
    }

    players.sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return a.name.length - b.name.length;
    });

    return players;
  } catch (error) {
    console.error('playerLookup error:', error);
    throw error;
  }
}

// Get recent aggregate stats for a pitcher over a date range
export async function getPitcherRecentStats(playerName: string, daysBack: number = 30): Promise<RecentPitcherStats | null> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const command = `mcporter call statcast pitching_stats_date_range 'start_date=${startStr}' 'end_date=${endStr}' 'player_name=${playerName}' 2>&1`;
    const output = await execMcporterNode(command);

    if (output.includes('No rows returned')) return null;

    const rows = parseTableWithHeader(output);
    if (rows.length === 0) return null;

    const row = rows[0]; // single row for one player
    const ip = (row.ip as number) || 0;
    const er = (row.er as number) || 0;
    const k = (row.so as number) || 0;
    const bb = (row.bb as number) || 0;
    const hr = (row.hr as number) || 0;

    return {
      era: ip > 0 ? (er * 9) / ip : 0,
      k_pct: ip > 0 ? (k / (ip * 3)) * 100 : 0, // rough K%
      bb_pct: ip > 0 ? (bb / (ip * 3)) * 100 : 0, // rough BB%
      hr_pct: ip > 0 ? (hr / (ip * 3)) * 100 : 0, // rough HR%
      whip: ip > 0 ? (k + bb) / ip : 0,
      ip,
      games: (row.g as number) || 1,
      date_range: `${startStr} to ${endStr}`,
    };
  } catch (error) {
    console.error('getPitcherRecentStats error:', error);
    return null;
  }
}

// Get full arsenal breakdown for a pitcher (2024 season - most complete dataset)
export async function getPitcherFullArsenal(playerName: string, year: number = 2025): Promise<PitchTypeStats[]> {
  try {
    const command = `mcporter call statcast statcast_pitcher_arsenal_stats 'year=${year}' 'player_name=${playerName}' 2>&1`;
    const output = await execMcporterNode(command);

    if (output.includes('No pitch-arsenal row') || output.includes('No rows returned')) return [];

    const rows = parseTableWithHeader(output);
    return rows.map(row => ({
      pitch_type: (row.pitch_type || '') as string,
      pitch_name: (row.pitch_name || '') as string,
      pct: (row.pitch_usage || 0) as number,
      pa: (row.pa || 0) as number,
      ba: (row.ba || 0) as number,
      slg: (row.slg || 0) as number,
      woba: (row.woba || 0) as number,
      whiff_pct: (row.whiff_percent || 0) as number,
      k_pct: (row.k_percent || 0) as number,
      est_ba: (row.est_ba || 0) as number,
      est_slg: (row.est_slg || 0) as number,
      est_woba: (row.est_woba || 0) as number,
      hard_hit_pct: (row.hard_hit_percent || 0) as number,
      run_value: (row.run_value || 0) as number,
      pitches: (row.pitches || 0) as number,
    }));
  } catch (error) {
    console.error('getPitcherFullArsenal error:', error);
    return [];
  }
}

export async function getPitcherData(playerName: string): Promise<PitcherData> {
  // Fetch recent stats and full arsenal in parallel
  const [recent, arsenal_full] = await Promise.all([
    getPitcherRecentStats(playerName),
    getPitcherFullArsenal(playerName),
  ]);

  const arsenal = arsenal_full.map(a => ({ pitch: a.pitch_name, pct: a.pct }));

  return {
    recent,
    arsenal,
    arsenal_full,
    season_stats: {
      era: recent?.era || 0,
      k_pct: recent?.k_pct || 0,
      bb_pct: recent?.bb_pct || 0,
      hr_pct: recent?.hr_pct || 0,
      whip: recent?.whip || 0,
    },
  };
}

export async function getBatterStats(playerName: string, year: number = 2025): Promise<BatterData> {
  try {
    const command = `mcporter call statcast statcast_batter_pitch_arsenal 'year=${year}' 'player_name=${playerName}' 2>&1`;
    const output = await execMcporterNode(command);

    if (output.includes('No rows returned')) {
      return { hr_rates: [], expected_stats: { avg: 0, obp: 0, slg: 0, hr_total: 0 } };
    }

    const rows = parseTableWithHeader(output);
    const hr_rates: BatterHRRate[] = rows.map(row => {
      const pa = row.pa as number || 1;
      const ba = row.ba as number || 0;
      const slg = row.slg as number || 0;
      const iso = Math.max(0, slg - ba);
      const hr_pct = Math.min(iso * 25, 15);
      return {
        pitch: (row.pitch_name || row.pitch_type || '') as string,
        hr_pct,
        barrel_pct: (row.hard_hit_percent || 0) as number,
        avg_exit_velo: 0,
        swings_and_misses: (row.whiff_percent || 0) as number,
      };
    });

    return {
      hr_rates,
      expected_stats: { avg: 0, obp: 0, slg: 0, hr_total: 0 },
    };
  } catch (error) {
    console.error('getBatterStats error:', error);
    throw error;
  }
}

// localStorage caching helpers
export function getCache<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > ttl) { localStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}

export function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() })); } catch { /* ignore */ }
}

export function getCacheKey(type: string, id: number, year: number = 2025): string {
  return `hr-prob-${type}-${id}-${year}`;
}
