/**
 * Sentinel-Node Constants
 * 
 * Configuration constants and thresholds for the self-healing agent.
 */

// ============================================================================
// SURPRISE THRESHOLDS
// ============================================================================

/**
 * Surprise score thresholds for status classification
 */
export const SURPRISE_THRESHOLDS = {
  /** Below this = normal status */
  WARNING: 0.4,
  /** Above this = critical status */
  CRITICAL: 0.7,
  /** Maximum possible surprise score */
  MAX: 1.0,
} as const;

// ============================================================================
// TELEMETRY CONFIGURATION
// ============================================================================

/**
 * Telemetry collection settings
 */
export const TELEMETRY_CONFIG = {
  /** Batch interval in milliseconds (30 seconds) */
  BATCH_INTERVAL_MS: 30_000,
  /** Maximum events in buffer before forced flush */
  MAX_BUFFER_SIZE: 500,
  /** Maximum telemetry sessions to keep in Firestore */
  MAX_SESSIONS: 1000,
  /** Telemetry session TTL in days */
  SESSION_TTL_DAYS: 7,
} as const;

// ============================================================================
// ANOMALY THRESHOLDS
// ============================================================================

/**
 * Thresholds for detecting specific anomaly types
 */
export const ANOMALY_THRESHOLDS = {
  /** Latency P95 in ms above which to trigger */
  LATENCY_SPIKE_P95: 500,
  /** Error rate above which to trigger */
  ERROR_RATE_HIGH: 0.05,
  /** Number of slow queries to trigger */
  DB_SLOW_QUERIES: 10,
  /** Connection count percentage to trigger */
  CONNECTION_EXHAUSTION_PERCENT: 80,
  /** Memory usage percentage to trigger */
  MEMORY_PRESSURE_PERCENT: 85,
  /** Cache miss rate to trigger */
  CACHE_MISS_RATE: 0.3,
} as const;

// ============================================================================
// REMEDIATION SETTINGS
// ============================================================================

/**
 * Remediation action settings
 */
export const REMEDIATION_CONFIG = {
  /** Default timeout for remediation actions (30 seconds) */
  DEFAULT_TIMEOUT_MS: 30_000,
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
  /** Delay between retries in ms */
  RETRY_DELAY_MS: 5_000,
  /** Actions that can be executed automatically (low risk only) */
  AUTO_EXECUTABLE_ACTIONS: ['cache_flush', 'clear_logs', 'socket_pulse'] as const,
} as const;

// ============================================================================
// RISK LEVELS
// ============================================================================

/**
 * Risk level definitions for remediation actions
 */
export const RISK_DEFINITIONS = {
  LOW: {
    description: 'No service interruption expected',
    requiresApproval: false,
    examples: ['cache_flush', 'clear_logs', 'socket_pulse'],
  },
  MEDIUM: {
    description: 'Brief service interruption possible',
    requiresApproval: true,
    examples: ['restart_service', 'db_vacuum', 'db_analyze'],
  },
  HIGH: {
    description: 'Significant service impact expected',
    requiresApproval: true,
    examples: ['scale_up', 'scale_down', 'connection_pool_reset'],
  },
} as const;

// ============================================================================
// INTERNAL MODEL DEFAULTS
// ============================================================================

/**
 * Default values for the internal model
 * Used when no historical data exists
 */
export const DEFAULT_MODEL: Omit<import('./types').InternalModel, 'lastUpdated'> = {
  id: 'current',
  baseline: {
    latencyP50: 50,
    latencyP95: 150,
    latencyP99: 300,
    errorRate: 0.01,
    requestRate: 100,
    dbConnections: 10,
    queryTimeAvg: 20,
    memoryUsage: 0.5,
  },
  variance: {
    latencyP50: 10,
    latencyP95: 30,
    latencyP99: 50,
    errorRate: 0.005,
    requestRate: 20,
    dbConnections: 3,
    queryTimeAvg: 5,
    memoryUsage: 0.1,
  },
  learningRate: 0.1,
  sampleCount: 0,
  minSamples: 100,
  isReady: false,
};

// ============================================================================
// FIRESTORE COLLECTION NAMES
// ============================================================================

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  TELEMETRY: 'telemetry',
  ANOMALIES: 'anomalies',
  INTERNAL_MODEL: 'internal_model',
  REMEDIATION_LOGS: 'remediation_logs',
  CONFIG: 'config',
  DISCORD_STATE: 'discord_state',
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

/**
 * HTTP status code classifications
 */
export const HTTP_STATUS = {
  isSuccess: (code: number): boolean => code >= 200 && code < 300,
  isRedirect: (code: number): boolean => code >= 300 && code < 400,
  isClientError: (code: number): boolean => code >= 400 && code < 500,
  isServerError: (code: number): boolean => code >= 500 && code < 600,
  isError: (code: number): boolean => code >= 400,
} as const;

// ============================================================================
// ENVIRONMENT
// ============================================================================

/**
 * Environment detection
 */
export const ENVIRONMENT = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
