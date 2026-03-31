// lib/parkFactors.ts - MLB stadium HR park factors

export interface ParkFactor {
  name: string;
  city: string;
  team: string;
  factor: number;
}

export const PARK_FACTORS: ParkFactor[] = [
  { name: 'Yankee Stadium', city: 'Bronx, NY', team: 'NYY', factor: 1.15 },
  { name: 'Coors Field', city: 'Denver, CO', team: 'COL', factor: 1.12 },
  { name: 'Oriole Park at Camden Yards', city: 'Baltimore, MD', team: 'BAL', factor: 1.08 },
  { name: 'Globe Life Field', city: 'Arlington, TX', team: 'TEX', factor: 1.06 },
  { name: 'Target Field', city: 'Minneapolis, MN', team: 'MIN', factor: 1.05 },
  { name: 'Great American Ball Park', city: 'Cincinnati, OH', team: 'CIN', factor: 1.04 },
  { name: 'Petco Park', city: 'San Diego, CA', team: 'SD', factor: 1.03 },
  { name: 'Citi Field', city: 'Queens, NY', team: 'NYM', factor: 1.02 },
  { name: 'Angel Stadium', city: 'Anaheim, CA', team: 'LAA', factor: 1.01 },
  { name: 'T-Mobile Park', city: 'Seattle, WA', team: 'SEA', factor: 1.01 },
  { name: 'Dodger Stadium', city: 'Los Angeles, CA', team: 'LAD', factor: 1.00 },
  { name: 'Wrigley Field', city: 'Chicago, IL', team: 'CHC', factor: 1.00 },
  { name: 'Fenway Park', city: 'Boston, MA', team: 'BOS', factor: 1.00 },
  { name: 'Rogers Centre', city: 'Toronto, ON', team: 'TOR', factor: 1.00 },
  { name: 'Citizens Bank Park', city: 'Philadelphia, PA', team: 'PHI', factor: 0.99 },
  { name: 'PNC Park', city: 'Pittsburgh, PA', team: 'PIT', factor: 0.98 },
  { name: 'Progressive Field', city: 'Cleveland, OH', team: 'CLE', factor: 0.98 },
  { name: 'Kauffman Stadium', city: 'Kansas City, MO', team: 'KC', factor: 0.98 },
  { name: 'Busch Stadium', city: 'St. Louis, MO', team: 'STL', factor: 0.97 },
  { name: 'Comerica Park', city: 'Detroit, MI', team: 'DET', factor: 0.97 },
  { name: 'Minute Maid Park', city: 'Houston, TX', team: 'HOU', factor: 0.96 },
  { name: 'Oracle Park', city: 'San Francisco, CA', team: 'SF', factor: 0.95 },
  { name: 'Marlins Park', city: 'Miami, FL', team: 'MIA', factor: 0.95 },
  { name: 'American Family Field', city: 'Milwaukee, WI', team: 'MIL', factor: 0.94 },
  { name: 'Guaranteed Rate Field', city: 'Chicago, IL', team: 'CWS', factor: 0.92 },
  { name: 'Oakland Coliseum', city: 'Oakland, CA', team: 'OAK', factor: 0.91 },
  { name: 'Nationals Park', city: 'Washington, DC', team: 'WSH', factor: 0.90 },
  { name: 'Tropicana Field', city: 'St. Petersburg, FL', team: 'TB', factor: 0.90 },
  { name: 'Chase Field', city: 'Phoenix, AZ', team: 'AZ', factor: 0.89 },
];

export function getParkFactor(parkName: string): number {
  const park = PARK_FACTORS.find(p => 
    p.name.toLowerCase().includes(parkName.toLowerCase()) ||
    parkName.toLowerCase().includes(p.name.toLowerCase())
  );
  return park?.factor ?? 1.0;
}

export function getParkOptions(): { value: string; label: string; factor: number }[] {
  return PARK_FACTORS.map(p => ({
    value: p.name,
    label: `${p.name} (${p.team})`,
    factor: p.factor,
  }));
}
