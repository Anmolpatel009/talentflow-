/**
 * Sentinel-Node Core Types
 * 
 * Type definitions for the self-healing infrastructure agent
 * based on Active Inference principles.
 */

// ============================================================================
// TELEMETRY TYPES
// ============================================================================

/**
 * Source of telemetry data
 */
export type TelemetrySource = 
  | 'talentflow-api'
  | 'talentflow-db'
  | 'talentflow-realtime'
  | 'talentflow-auth'
  | 'talentflow-storage';

/**
 * System status based on surprise score
 */
export type SystemStatus = 'normal' | 'warning' | 'critical';

/**
 * Latency metrics in milliseconds
 */
export interface LatencyMetrics {
  /** 50th percentile latency */
  p50: number;
  /** 95th percentile latency */
  p95: number;
  /** 99th percentile latency */
  p99: number;
  /** Minimum latency observed */
  min: number;
  /** Maximum latency observed */
  max: number;
}

/**
 * Error metrics
 */
export interface ErrorMetrics {
  /** Total error count in session */
  count: number;
  /** Error rate (0-1) */
  rate: number;
  /** Errors grouped by type */
  types: Record<string, number>;
  /** Most recent error messages */
  recent: Array<{
    message: string;
    code?: string;
    timestamp: number;
  }>;
}

/**
 * Request metrics
 */
export interface RequestMetrics {
  /** Total requests in session */
  total: number;
  /** Successful requests (status < 400) */
  successful: number;
  /** Failed requests (status >= 400) */
  failed: number;
  /** Requests by HTTP method */
  byMethod: Record<string, number>;
  /** Requests by endpoint path */
  byPath: Record<string, number>;
}

/**
 * Database metrics
 */
export interface DatabaseMetrics {
  /** Active database connections */
  activeConnections: number;
  /** Average query time in ms */
  queryTimeAvg: number;
  /** Number of slow queries (> threshold) */
  slowQueries: number;
  /** Connection pool utilization (0-1) */
  poolUtilization: number;
  /** Database size in bytes */
  dbSize?: number;
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  /** Heap used in bytes */
  heapUsed: number;
  /** Heap total in bytes */
  heapTotal: number;
  /** External memory in bytes */
  external: number;
  /** RSS (Resident Set Size) in bytes */
  rss: number;
}

/**
 * Complete metrics snapshot
 */
export interface MetricsSnapshot {
  latency: LatencyMetrics;
  errors: ErrorMetrics;
  requests: RequestMetrics;
  database: DatabaseMetrics;
  memory?: MemoryMetrics;
  /** Custom metrics from application */
  custom?: Record<string, number | string | boolean>;
}

/**
 * Telemetry session written to Firestore
 * Aggregated from individual metric events
 */
export interface TelemetrySession {
  /** Unique session ID */
  id: string;
  /** When this session was recorded */
  timestamp: Date;
  /** Source of telemetry */
  source: TelemetrySource;
  /** Aggregated metrics */
  metrics: MetricsSnapshot;
  /** Calculated surprise score (0-1) */
  surpriseScore: number;
  /** System status based on surprise */
  status: SystemStatus;
  /** Environment (production, staging, development) */
  environment: string;
  /** Version of the application */
  version?: string;
  /** Hostname of the server */
  hostname?: string;
}

// ============================================================================
// ANOMALY TYPES
// ============================================================================

/**
 * Types of anomalies that can be detected
 */
export type AnomalyType =
  | 'latency_spike'
  | 'error_rate_high'
  | 'db_slow_queries'
  | 'connection_exhaustion'
  | 'memory_pressure'
  | 'state_desync'
  | 'cache_miss_high'
  | 'request_rate_anomaly'
  | 'custom';

/**
 * Severity levels for anomalies
 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of an anomaly
 */
export type AnomalyStatus = 
  | 'pending'      // Awaiting review
  | 'approved'     // Approved for remediation
  | 'rejected'     // Rejected by human
  | 'executing'    // Remediation in progress
  | 'resolved'     // Successfully fixed
  | 'failed';      // Remediation failed

/**
 * Anomaly record in Firestore
 */
export interface Anomaly {
  /** Unique anomaly ID */
  id: string;
  /** When the anomaly was detected */
  detectedAt: Date;
  /** Type of anomaly */
  type: AnomalyType;
  /** Severity level */
  severity: AnomalySeverity;
  /** Human-readable description */
  description: string;
  /** Metrics at time of detection */
  metricsSnapshot: MetricsSnapshot;
  /** Surprise score that triggered this anomaly */
  surpriseScore: number;
  /** Whether this can be auto-fixed */
  autoFixable: boolean;
  /** Suggested remediation action */
  remediationAction?: RemediationAction;
  /** Current status */
  status: AnomalyStatus;
  /** Who approved the remediation (if applicable) */
  approvedBy?: string;
  /** When the remediation was approved */
  approvedAt?: Date;
  /** When the anomaly was resolved */
  resolvedAt?: Date;
  /** Resolution notes */
  resolutionNotes?: string;
  /** Related telemetry session ID */
  telemetrySessionId?: string;
}

// ============================================================================
// REMEDIATION TYPES
// ============================================================================

/**
 * Types of remediation actions
 */
export type RemediationActionType =
  | 'cache_flush'
  | 'restart_service'
  | 'scale_up'
  | 'scale_down'
  | 'clear_logs'
  | 'db_vacuum'
  | 'db_analyze'
  | 'connection_pool_reset'
  | 'socket_pulse'
  | 'webhook_call'
  | 'custom_script'
  | 'custom';

/**
 * Risk level for remediation actions
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Remediation action definition
 */
export interface RemediationAction {
  /** Type of action */
  type: RemediationActionType;
  /** Target service/resource */
  target: string;
  /** Action-specific parameters */
  parameters: Record<string, unknown>;
  /** Risk level of this action */
  riskLevel: RiskLevel;
  /** Human-readable impact description */
  estimatedImpact: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retry?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
}

/**
 * Result of a remediation execution
 */
export interface RemediationResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Action that was executed */
  action: RemediationActionType;
  /** Output from the action */
  output?: string;
  /** Error message if failed */
  error?: string;
  /** Execution time in ms */
  duration: number;
  /** Timestamp of execution */
  timestamp: Date;
  /** Who/what triggered the execution */
  executedBy: string;
}

/**
 * Remediation log entry
 */
export interface RemediationLog {
  /** Unique log ID */
  id: string;
  /** Related anomaly ID */
  anomalyId: string;
  /** Action that was executed */
  action: RemediationActionType;
  /** Who triggered the action */
  executedBy: string;
  /** Result of the action */
  result: 'success' | 'failed' | 'partial';
  /** Timestamp */
  timestamp: Date;
  /** Detailed output */
  details: RemediationResult;
}

// ============================================================================
// INTERNAL MODEL TYPES (Active Inference)
// ============================================================================

/**
 * Baseline metrics for the internal model
 * Represents the "expected" normal state
 */
export interface ModelBaseline {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  requestRate: number;
  dbConnections: number;
  queryTimeAvg: number;
  memoryUsage: number;
}

/**
 * Variance metrics for the internal model
 * Used for surprise calculation
 */
export interface ModelVariance {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  requestRate: number;
  dbConnections: number;
  queryTimeAvg: number;
  memoryUsage: number;
}

/**
 * Internal model for Active Inference
 * Maintains the system's "belief" about normal state
 */
export interface InternalModel {
  /** Always 'current' - single document */
  id: 'current';
  /** Expected baseline values */
  baseline: ModelBaseline;
  /** Variance for each metric */
  variance: ModelVariance;
  /** Learning rate (0-1) for model updates */
  learningRate: number;
  /** When the model was last updated */
  lastUpdated: Date;
  /** Number of samples used to build model */
  sampleCount: number;
  /** Minimum samples before model is considered stable */
  minSamples: number;
  /** Whether the model is ready for inference */
  isReady: boolean;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Sentinel configuration
 */
export interface SentinelConfig {
  /** Surprise threshold for warning status */
  warningThreshold: number;
  /** Surprise threshold for critical status */
  criticalThreshold: number;
  /** Telemetry batch interval in ms */
  batchIntervalMs: number;
  /** Maximum telemetry sessions to keep */
  maxTelemetrySessions: number;
  /** Enable auto-remediation for low-risk actions */
  enableAutoRemediation: boolean;
  /** Discord channel for alerts */
  discordChannelId?: string;
  /** Actuator API endpoint */
  actuatorEndpoint: string;
  /** Environment */
  environment: 'production' | 'staging' | 'development';
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: SentinelConfig = {
  warningThreshold: 0.4,
  criticalThreshold: 0.7,
  batchIntervalMs: 30000, // 30 seconds
  maxTelemetrySessions: 1000,
  enableAutoRemediation: true,
  actuatorEndpoint: 'http://localhost:3001',
  environment: 'development',
};

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Individual metric event (before aggregation)
 */
export interface MetricEvent {
  /** Timestamp of the event */
  timestamp: number;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Response status code */
  status: number;
  /** Request duration in ms */
  duration: number;
  /** Whether the request was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
}

/**
 * Discord notification payload
 */
export interface DiscordNotification {
  /** Anomaly to notify about */
  anomalyId: string;
  /** Type of anomaly */
  type: AnomalyType;
  /** Severity */
  severity: AnomalySeverity;
  /** Description */
  description: string;
  /** Surprise score */
  surpriseScore: number;
  /** Suggested action */
  suggestedAction?: string;
  /** Whether auto-fixable */
  autoFixable: boolean;
}
