/**
 * Anomaly Detector
 * 
 * Classifies anomalies and suggests remediation actions.
 * Part of the "Executive" layer of Sentinel-Node.
 */

import type {
  AnomalyType,
  AnomalySeverity,
  MetricsSnapshot,
  RemediationAction,
  RemediationActionType,
  RiskLevel,
} from '@sentinel/core';
import { ANOMALY_THRESHOLDS, SURPRISE_THRESHOLDS } from '@sentinel/core';

/**
 * Anomaly classification result
 */
export interface AnomalyClassification {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  remediation: RemediationAction;
}

/**
 * Classify an anomaly based on metrics
 */
export function classifyAnomaly(
  metrics: MetricsSnapshot,
  surpriseScore: number
): AnomalyClassification {
  // Determine the primary anomaly type
  const type = determineAnomalyType(metrics);
  
  // Determine severity based on surprise score
  const severity = determineSeverity(surpriseScore, metrics);
  
  // Generate description
  const description = generateDescription(type, metrics);
  
  // Suggest remediation
  const remediation = suggestRemediation(type, metrics);
  
  return {
    type,
    severity,
    description,
    remediation,
  };
}

/**
 * Determine the type of anomaly based on metrics
 */
export function determineAnomalyType(metrics: MetricsSnapshot): AnomalyType {
  const { latency, errors, database } = metrics;
  
  // Check in priority order (most critical first)
  
  // High error rate
  if (errors.rate >= ANOMALY_THRESHOLDS.ERROR_RATE_HIGH) {
    return 'error_rate_high';
  }
  
  // Latency spike
  if (latency.p95 >= ANOMALY_THRESHOLDS.LATENCY_SPIKE_P95) {
    return 'latency_spike';
  }
  
  // Database issues
  if (database.slowQueries >= ANOMALY_THRESHOLDS.DB_SLOW_QUERIES) {
    return 'db_slow_queries';
  }
  
  // Connection exhaustion
  if (database.poolUtilization * 100 >= ANOMALY_THRESHOLDS.CONNECTION_EXHAUSTION_PERCENT) {
    return 'connection_exhaustion';
  }
  
  // Memory pressure
  if (metrics.memory) {
    const memoryUsagePercent = metrics.memory.heapUsed / metrics.memory.heapTotal;
    if (memoryUsagePercent * 100 >= ANOMALY_THRESHOLDS.MEMORY_PRESSURE_PERCENT) {
      return 'memory_pressure';
    }
  }
  
  // Default to latency spike if surprise is high but no specific pattern
  return 'latency_spike';
}

/**
 * Determine severity based on surprise score and metrics
 */
export function determineSeverity(
  surpriseScore: number,
  metrics: MetricsSnapshot
): AnomalySeverity {
  // Critical: Very high surprise or system is failing
  if (surpriseScore >= SURPRISE_THRESHOLDS.CRITICAL) {
    return 'critical';
  }
  
  // High: Error rate is very high
  if (metrics.errors.rate >= 0.1) { // 10% error rate
    return 'high';
  }
  
  // High: Latency is very high
  if (metrics.latency.p95 >= 1000) { // 1 second
    return 'high';
  }
  
  // Medium: Above warning threshold
  if (surpriseScore >= SURPRISE_THRESHOLDS.WARNING) {
    return 'medium';
  }
  
  // Low: Below warning threshold (shouldn't happen, but fallback)
  return 'low';
}

/**
 * Generate a human-readable description of the anomaly
 */
export function generateDescription(type: AnomalyType, metrics: MetricsSnapshot): string {
  const descriptions: Record<AnomalyType, string> = {
    latency_spike: `Latency spike detected: P95 latency at ${metrics.latency.p95}ms (threshold: ${ANOMALY_THRESHOLDS.LATENCY_SPIKE_P95}ms)`,
    error_rate_high: `High error rate detected: ${(metrics.errors.rate * 100).toFixed(1)}% of requests failing (threshold: ${(ANOMALY_THRESHOLDS.ERROR_RATE_HIGH * 100)}%)`,
    db_slow_queries: `Slow database queries detected: ${metrics.database.slowQueries} queries exceeded threshold`,
    connection_exhaustion: `Database connection pool near capacity: ${(metrics.database.poolUtilization * 100).toFixed(0)}% utilized`,
    memory_pressure: `High memory usage detected`,
    state_desync: `State desynchronization detected between services`,
    cache_miss_high: `High cache miss rate detected`,
    request_rate_anomaly: `Abnormal request rate pattern detected`,
    custom: `Anomaly detected in system metrics`,
  };
  
  return descriptions[type] ?? 'Unknown anomaly type';
}

/**
 * Suggest a remediation action based on anomaly type
 */
export function suggestRemediation(
  type: AnomalyType,
  metrics: MetricsSnapshot
): RemediationAction {
  const actions: Record<AnomalyType, RemediationAction> = {
    latency_spike: {
      type: 'cache_flush',
      target: 'redis',
      parameters: { pattern: '*' },
      riskLevel: 'low',
      estimatedImpact: 'Clears stale cache entries. May temporarily increase database load.',
      timeout: 10000,
    },
    error_rate_high: {
      type: 'restart_service',
      target: 'api',
      parameters: { graceful: true, timeout: 30 },
      riskLevel: 'medium',
      estimatedImpact: 'Graceful restart of API service. Brief interruption (~5-10s) possible.',
      timeout: 60000,
    },
    db_slow_queries: {
      type: 'db_vacuum',
      target: 'postgresql',
      parameters: { table: 'tasks', analyze: true },
      riskLevel: 'medium',
      estimatedImpact: 'Vacuum and analyze database tables. May briefly lock tables.',
      timeout: 120000,
    },
    connection_exhaustion: {
      type: 'connection_pool_reset',
      target: 'database',
      parameters: { drain_timeout: 30 },
      riskLevel: 'high',
      estimatedImpact: 'Resets connection pool. All active queries will be terminated.',
      timeout: 60000,
    },
    memory_pressure: {
      type: 'clear_logs',
      target: 'application',
      parameters: { older_than_days: 7, max_size_mb: 100 },
      riskLevel: 'low',
      estimatedImpact: 'Clears old log files to free disk space.',
      timeout: 30000,
    },
    state_desync: {
      type: 'socket_pulse',
      target: 'realtime',
      parameters: { broadcast: true, force_resync: true },
      riskLevel: 'low',
      estimatedImpact: 'Forces all connected clients to resync state.',
      timeout: 10000,
    },
    cache_miss_high: {
      type: 'cache_flush',
      target: 'redis',
      parameters: { pattern: '*', warmup: true },
      riskLevel: 'low',
      estimatedImpact: 'Clears and warms up cache.',
      timeout: 30000,
    },
    request_rate_anomaly: {
      type: 'scale_up',
      target: 'api',
      parameters: { instances: 2 },
      riskLevel: 'high',
      estimatedImpact: 'Scales up API instances. Increases infrastructure cost.',
      timeout: 120000,
    },
    custom: {
      type: 'custom_script',
      target: 'system',
      parameters: { script: 'diagnostic' },
      riskLevel: 'medium',
      estimatedImpact: 'Runs diagnostic script.',
      timeout: 60000,
    },
  };
  
  return actions[type] ?? actions.custom;
}

/**
 * Check if a remediation action can be executed automatically
 */
export function isAutoFixable(remediation: RemediationAction): boolean {
  return remediation.riskLevel === 'low';
}

/**
 * Get all anomaly types
 */
export const ANOMALY_TYPES: AnomalyType[] = [
  'latency_spike',
  'error_rate_high',
  'db_slow_queries',
  'connection_exhaustion',
  'memory_pressure',
  'state_desync',
  'cache_miss_high',
  'request_rate_anomaly',
  'custom',
];

/**
 * Get all severity levels
 */
export const SEVERITY_LEVELS: AnomalySeverity[] = ['low', 'medium', 'high', 'critical'];

/**
 * Get all risk levels
 */
export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
