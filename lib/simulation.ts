// lib/simulation.ts - Monte Carlo simulation for HR probability

export interface SimulationParams {
  hrProb: number; // as percentage (e.g., 5.33 for 5.33%)
  numPAs: number;  // number of plate appearances to simulate
  iterations: number; // number of simulation iterations
}

export interface SimulationResult {
  hrDistribution: number[]; // array of HR counts (0 to numPAs) with frequency
  mean: number;
  median: number;
  p10: number;
  p90: number;
  stdDev: number;
  totalHRs: number;
  totalPAs: number;
}

export function simulateHRDistribution(params: SimulationParams): SimulationResult {
  const { hrProb, numPAs, iterations } = params;
  const hrProbability = hrProb / 100;
  
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    let hrs = 0;
    for (let pa = 0; pa < numPAs; pa++) {
      if (Math.random() < hrProbability) {
        hrs++;
      }
    }
    results.push(hrs);
  }
  
  // Sort for percentile calculations
  const sorted = [...results].sort((a, b) => a - b);
  
  // Calculate distribution (how many times each HR count occurred)
  const distribution = new Array(numPAs + 1).fill(0);
  for (const hrs of results) {
    distribution[hrs]++;
  }
  
  // Convert to percentage
  const hrDistribution = distribution.map(count => (count / iterations) * 100);
  
  const mean = results.reduce((a, b) => a + b, 0) / iterations;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p10 = sorted[Math.floor(iterations * 0.1)];
  const p90 = sorted[Math.floor(iterations * 0.9)];
  
  const variance = results.reduce((acc, hrs) => acc + Math.pow(hrs - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);
  
  return {
    hrDistribution,
    mean,
    median,
    p10,
    p90,
    stdDev,
    totalHRs: mean * iterations,
    totalPAs: numPAs * iterations,
  };
}

export function getExpectedRange(result: SimulationResult): string {
  return `${Math.round(result.p10)}–${Math.round(result.p90)}`;
}
