import { IBehavioralProfile } from '../models/User';

export interface BehavioralData {
  typingPattern: number[];
  mouseMovements: number[];
  navigationPattern: number[];
}

export class BehavioralService {
  // Vectorize typing pattern (keystroke dynamics)
  static vectorizeTypingPattern(keystrokes: any[]): number[] {
    if (!keystrokes || keystrokes.length === 0) {
      return Array(10).fill(0);
    }

    // Extract timing features
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];

    for (const keystroke of keystrokes) {
      if (keystroke.dwellTime) dwellTimes.push(keystroke.dwellTime);
      if (keystroke.flightTime) flightTimes.push(keystroke.flightTime);
    }

    // Calculate statistical features
    const vector = [
      this.mean(dwellTimes),
      this.std(dwellTimes),
      this.mean(flightTimes),
      this.std(flightTimes),
      keystrokes.length / 60, // Typing speed (keys per second)
      this.percentile(dwellTimes, 0.25),
      this.percentile(dwellTimes, 0.75),
      this.percentile(flightTimes, 0.25),
      this.percentile(flightTimes, 0.75),
      this.max(dwellTimes) - this.min(dwellTimes), // Range
    ];

    return vector;
  }

  // Vectorize mouse movements
  static vectorizeMouseMovements(movements: any[]): number[] {
    if (!movements || movements.length === 0) {
      return Array(10).fill(0);
    }

    const speeds: number[] = [];
    const accelerations: number[] = [];
    const angles: number[] = [];

    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];

      // Calculate speed
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      if (timeDiff > 0) {
        speeds.push(distance / timeDiff);
      }

      // Calculate angle
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      angles.push(angle);
    }

    // Calculate accelerations
    for (let i = 1; i < speeds.length; i++) {
      accelerations.push(speeds[i] - speeds[i - 1]);
    }

    const vector = [
      this.mean(speeds),
      this.std(speeds),
      this.mean(accelerations),
      this.std(accelerations),
      this.mean(angles),
      this.std(angles),
      movements.length / 60, // Movement frequency
      this.percentile(speeds, 0.9), // 90th percentile speed
      this.max(speeds),
      this.curvature(movements),
    ];

    return vector;
  }

  // Vectorize navigation pattern
  static vectorizeNavigationPattern(pages: string[]): number[] {
    if (!pages || pages.length === 0) {
      return Array(8).fill(0);
    }

    // Create navigation features
    const uniquePages = new Set(pages);
    const pageFrequency: Map<string, number> = new Map();

    for (const page of pages) {
      pageFrequency.set(page, (pageFrequency.get(page) || 0) + 1);
    }

    const frequencies = Array.from(pageFrequency.values());

    const vector = [
      pages.length, // Total pages visited
      uniquePages.size, // Unique pages
      uniquePages.size / pages.length, // Diversity ratio
      this.mean(frequencies),
      this.std(frequencies),
      this.max(frequencies),
      this.entropy(frequencies), // Navigation entropy
      this.backtrackRatio(pages), // How often user goes back
    ];

    return vector;
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Analyze behavioral similarity
  static analyzeBehavior(
    currentData: BehavioralData,
    profile: IBehavioralProfile
  ): { similarityScore: number; anomalyDetected: boolean } {
    const typingSimilarity = this.cosineSimilarity(
      currentData.typingPattern,
      profile.typingPattern.vector
    );

    const mouseSimilarity = this.cosineSimilarity(
      currentData.mouseMovements,
      profile.mouseMovements.vector
    );

    const navigationSimilarity = this.cosineSimilarity(
      currentData.navigationPattern,
      profile.navigationPattern.vector
    );

    // Weighted average (typing most important, then mouse, then navigation)
    const similarityScore =
      typingSimilarity * 0.5 + mouseSimilarity * 0.35 + navigationSimilarity * 0.15;

    // Anomaly threshold
    const anomalyDetected = similarityScore < 0.7;

    return {
      similarityScore,
      anomalyDetected,
    };
  }

  // Statistical helper functions
  private static mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private static std(arr: number[]): number {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  private static min(arr: number[]): number {
    return arr.length === 0 ? 0 : Math.min(...arr);
  }

  private static max(arr: number[]): number {
    return arr.length === 0 ? 0 : Math.max(...arr);
  }

  private static percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index];
  }

  private static entropy(frequencies: number[]): number {
    const total = frequencies.reduce((sum, f) => sum + f, 0);
    if (total === 0) return 0;

    return frequencies.reduce((entropy, freq) => {
      if (freq === 0) return entropy;
      const probability = freq / total;
      return entropy - probability * Math.log2(probability);
    }, 0);
  }

  private static curvature(movements: any[]): number {
    if (movements.length < 3) return 0;

    let totalCurvature = 0;
    for (let i = 1; i < movements.length - 1; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      const next = movements[i + 1];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      const curvature = Math.abs(angle2 - angle1);

      totalCurvature += curvature;
    }

    return totalCurvature / (movements.length - 2);
  }

  private static backtrackRatio(pages: string[]): number {
    if (pages.length < 2) return 0;

    let backtrackCount = 0;
    for (let i = 1; i < pages.length; i++) {
      if (pages[i] === pages[i - 2]) {
        backtrackCount++;
      }
    }

    return backtrackCount / (pages.length - 1);
  }
}
