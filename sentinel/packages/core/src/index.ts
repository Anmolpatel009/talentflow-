/**
 * Sentinel-Node Core Package
 * 
 * Exports all types, constants, and utilities for the self-healing agent.
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Re-export commonly used types for convenience
export type {
  TelemetrySession,
  MetricsSnapshot,
  Anomaly,
  AnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  RemediationAction,
  RemediationActionType,
  RemediationResult,
  InternalModel,
  MetricEvent,
  SentinelConfig,
} from './types';

// Re-export constants
export {
  SURPRISE_THRESHOLDS,
  TELEMETRY_CONFIG,
  ANOMALY_THRESHOLDS,
  REMEDIATION_CONFIG,
  RISK_DEFINITIONS,
  DEFAULT_MODEL,
  COLLECTIONS,
  HTTP_STATUS,
  ENVIRONMENT,
} from './constants';
