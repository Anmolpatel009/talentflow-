/**
 * Sentinel Brain Package
 * 
 * Active Inference engine for anomaly detection.
 * Implements Layer 4 (Executive) of the 6-Layer Autonomous Framework.
 */

// Inference Engine
export { ActiveInferenceEngine, createInferenceEngine } from './inference-engine';

// Anomaly Detection
export {
  classifyAnomaly,
  determineAnomalyType,
  determineSeverity,
  generateDescription,
  suggestRemediation,
  isAutoFixable,
  ANOMALY_TYPES,
  SEVERITY_LEVELS,
  RISK_LEVELS,
} from './anomaly-detector';
export type { AnomalyClassification } from './anomaly-detector';

// Re-export types from core for convenience
export type {
  InternalModel,
  MetricsSnapshot,
  Anomaly,
  AnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  RemediationAction,
  RemediationActionType,
  RiskLevel,
} from '@sentinel/core';
