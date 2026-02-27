/**
 * Sentinel Sensor Package
 * 
 * Telemetry collection middleware for the Sentinel-Node self-healing agent.
 * Implements Layer 1 (Ingestion) of the 6-Layer Autonomous Framework.
 */

// Core exports
export { MetricsCollector, initCollector, getCollector, recordMetric } from './collector';
export type { CollectorConfig } from './collector';

// Middleware exports
export { withSentinel, withSentinelHandler, recordTelemetry } from './middleware';
export type { SentinelMiddlewareOptions } from './middleware';

// Re-export types from core for convenience
export type {
  MetricEvent,
  TelemetrySession,
  TelemetrySource,
} from '@sentinel/core';
