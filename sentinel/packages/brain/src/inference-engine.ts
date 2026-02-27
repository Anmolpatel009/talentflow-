/**
 * Active Inference Engine
 * 
 * Implements the "Executive" layer of Sentinel-Node.
 * Calculates "Surprise" scores based on deviations from the internal model.
 * 
 * The core formula: S = -ln(P(observation | model))
 * Higher surprise = more unexpected observation = potential anomaly
 */

import type {
  InternalModel,
  MetricsSnapshot,
  ModelBaseline,
  ModelVariance,
} from '@sentinel/core';
import { SURPRISE_THRESHOLDS, DEFAULT_MODEL } from '@sentinel/core';

/**
 * Weights for different metrics in surprise calculation
 */
const METRIC_WEIGHTS = {
  latencyP95: 1.0,
  latencyP99: 0.8,
  errorRate: 2.0,    // Errors are weighted more heavily
  queryTimeAvg: 1.2,
  dbConnections: 0.5,
  memoryUsage: 0.7,
} as const;

/**
 * Active Inference Engine class
 * 
 * Maintains an internal model of "normal" system behavior
 * and calculates surprise scores for new observations.
 */
export class ActiveInferenceEngine {
  private model: InternalModel;
  
  constructor(initialModel?: Partial<InternalModel>) {
    this.model = {
      ...DEFAULT_MODEL,
      ...initialModel,
      lastUpdated: new Date(),
    } as InternalModel;
  }
  
  /**
   * Get the current internal model
   */
  getModel(): InternalModel {
    return { ...this.model };
  }
  
  /**
   * Calculate the surprise score for a metrics observation
   * 
   * @returns Surprise score between 0 and 1
   */
  calculateSurprise(observation: MetricsSnapshot): number {
    if (!this.model.isReady) {
      // Model not ready yet, return low surprise
      return 0;
    }
    
    const surprises: Array<{ value: number; weight: number }> = [];
    
    // Latency surprise (P95)
    surprises.push({
      value: this.gaussianSurprise(
        observation.latency.p95,
        this.model.baseline.latencyP95,
        this.model.variance.latencyP95
      ),
      weight: METRIC_WEIGHTS.latencyP95,
    });
    
    // Latency surprise (P99)
    surprises.push({
      value: this.gaussianSurprise(
        observation.latency.p99,
        this.model.baseline.latencyP99,
        this.model.variance.latencyP99
      ),
      weight: METRIC_WEIGHTS.latencyP99,
    });
    
    // Error rate surprise
    surprises.push({
      value: this.gaussianSurprise(
        observation.errors.rate,
        this.model.baseline.errorRate,
        this.model.variance.errorRate
      ),
      weight: METRIC_WEIGHTS.errorRate,
    });
    
    // Database query time surprise
    surprises.push({
      value: this.gaussianSurprise(
        observation.database.queryTimeAvg,
        this.model.baseline.queryTimeAvg,
        this.model.variance.queryTimeAvg
      ),
      weight: METRIC_WEIGHTS.queryTimeAvg,
    });
    
    // Database connections surprise
    surprises.push({
      value: this.gaussianSurprise(
        observation.database.activeConnections,
        this.model.baseline.dbConnections,
        this.model.variance.dbConnections
      ),
      weight: METRIC_WEIGHTS.dbConnections,
    });
    
    // Memory usage surprise (if available)
    if (observation.memory && this.model.baseline.memoryUsage > 0) {
      const memoryUsagePercent = observation.memory.heapUsed / observation.memory.heapTotal;
      surprises.push({
        value: this.gaussianSurprise(
          memoryUsagePercent,
          this.model.baseline.memoryUsage,
          this.model.variance.memoryUsage
        ),
        weight: METRIC_WEIGHTS.memoryUsage,
      });
    }
    
    // Calculate weighted average surprise
    const totalWeight = surprises.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = surprises.reduce((sum, s) => sum + s.value * s.weight, 0);
    
    // Normalize to 0-1 range
    const rawSurprise = weightedSum / totalWeight;
    return Math.min(1, Math.max(0, rawSurprise));
  }
  
  /**
   * Calculate Gaussian surprise for a single metric
   * 
   * Uses the formula: S = -ln(P(x | μ, σ))
   * Where P is the Gaussian probability density
   */
  private gaussianSurprise(
    observed: number,
    expected: number,
    variance: number
  ): number {
    // Handle edge cases
    if (variance <= 0) {
      // No variance means we expect exact match
      return observed === expected ? 0 : 1;
    }
    
    if (expected === 0 && observed === 0) {
      return 0;
    }
    
    // Calculate z-score (how many standard deviations from mean)
    const stdDev = Math.sqrt(variance);
    const zScore = Math.abs(observed - expected) / stdDev;
    
    // Convert z-score to surprise
    // Using a sigmoid-like transformation to map to 0-1
    // Higher z-score = higher surprise
    const surprise = 1 - Math.exp(-0.5 * zScore * zScore);
    
    return surprise;
  }
  
  /**
   * Update the internal model with a new observation
   * 
   * Implements Bayesian updating with exponential moving average
   */
  updateModel(observation: MetricsSnapshot): InternalModel {
    const lr = this.model.learningRate;
    
    // Update baseline with exponential moving average
    const newBaseline: ModelBaseline = {
      latencyP50: this.updateValue(observation.latency.p50, this.model.baseline.latencyP50, lr),
      latencyP95: this.updateValue(observation.latency.p95, this.model.baseline.latencyP95, lr),
      latencyP99: this.updateValue(observation.latency.p99, this.model.baseline.latencyP99, lr),
      errorRate: this.updateValue(observation.errors.rate, this.model.baseline.errorRate, lr),
      requestRate: this.updateValue(observation.requests.total, this.model.baseline.requestRate, lr),
      dbConnections: this.updateValue(observation.database.activeConnections, this.model.baseline.dbConnections, lr),
      queryTimeAvg: this.updateValue(observation.database.queryTimeAvg, this.model.baseline.queryTimeAvg, lr),
      memoryUsage: observation.memory
        ? this.updateValue(observation.memory.heapUsed / observation.memory.heapTotal, this.model.baseline.memoryUsage, lr)
        : this.model.baseline.memoryUsage,
    };
    
    // Update variance
    const newVariance: ModelVariance = {
      latencyP50: this.updateVariance(observation.latency.p50, newBaseline.latencyP50, this.model.variance.latencyP50, lr),
      latencyP95: this.updateVariance(observation.latency.p95, newBaseline.latencyP95, this.model.variance.latencyP95, lr),
      latencyP99: this.updateVariance(observation.latency.p99, newBaseline.latencyP99, this.model.variance.latencyP99, lr),
      errorRate: this.updateVariance(observation.errors.rate, newBaseline.errorRate, this.model.variance.errorRate, lr),
      requestRate: this.updateVariance(observation.requests.total, newBaseline.requestRate, this.model.variance.requestRate, lr),
      dbConnections: this.updateVariance(observation.database.activeConnections, newBaseline.dbConnections, this.model.variance.dbConnections, lr),
      queryTimeAvg: this.updateVariance(observation.database.queryTimeAvg, newBaseline.queryTimeAvg, this.model.variance.queryTimeAvg, lr),
      memoryUsage: observation.memory
        ? this.updateVariance(observation.memory.heapUsed / observation.memory.heapTotal, newBaseline.memoryUsage, this.model.variance.memoryUsage, lr)
        : this.model.variance.memoryUsage,
    };
    
    const newSampleCount = this.model.sampleCount + 1;
    
    this.model = {
      ...this.model,
      baseline: newBaseline,
      variance: newVariance,
      sampleCount: newSampleCount,
      isReady: newSampleCount >= this.model.minSamples,
      lastUpdated: new Date(),
    };
    
    return this.model;
  }
  
  /**
   * Update a single value using exponential moving average
   */
  private updateValue(observed: number, current: number, learningRate: number): number {
    return learningRate * observed + (1 - learningRate) * current;
  }
  
  /**
   * Update variance estimate
   */
  private updateVariance(observed: number, mean: number, currentVariance: number, learningRate: number): number {
    const squaredDiff = Math.pow(observed - mean, 2);
    return learningRate * squaredDiff + (1 - learningRate) * currentVariance;
  }
  
  /**
   * Determine system status based on surprise score
   */
  static determineStatus(surpriseScore: number): 'normal' | 'warning' | 'critical' {
    if (surpriseScore >= SURPRISE_THRESHOLDS.CRITICAL) {
      return 'critical';
    }
    if (surpriseScore >= SURPRISE_THRESHOLDS.WARNING) {
      return 'warning';
    }
    return 'normal';
  }
  
  /**
   * Check if a surprise score indicates an anomaly
   */
  static isAnomaly(surpriseScore: number): boolean {
    return surpriseScore >= SURPRISE_THRESHOLDS.WARNING;
  }
}

/**
 * Create a new Active Inference Engine
 */
export function createInferenceEngine(initialModel?: Partial<InternalModel>): ActiveInferenceEngine {
  return new ActiveInferenceEngine(initialModel);
}
