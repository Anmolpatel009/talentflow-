/**
 * Metrics Collector
 * 
 * Collects and batches metric events before writing to Firestore.
 * Implements the "Nervous System" layer of Sentinel-Node.
 */

import type {
  MetricEvent,
  MetricsSnapshot,
  TelemetrySession,
  TelemetrySource,
  LatencyMetrics,
  ErrorMetrics,
  RequestMetrics,
} from '@sentinel/core';
import { TELEMETRY_CONFIG, COLLECTIONS } from '@sentinel/core';
import { collection, addDoc, type Firestore } from 'firebase/firestore';

/**
 * Configuration for the metrics collector
 */
export interface CollectorConfig {
  /** Firebase Firestore instance */
  firestore: Firestore;
  /** Telemetry source identifier */
  source: TelemetrySource;
  /** Batch interval in milliseconds */
  batchIntervalMs?: number;
  /** Maximum buffer size before forced flush */
  maxBufferSize?: number;
  /** Environment identifier */
  environment?: string;
  /** Application version */
  version?: string;
}

/**
 * Metrics Collector class
 * 
 * Buffers metric events and flushes them to Firestore in batches.
 * This reduces write operations to stay within Firebase free tier limits.
 */
export class MetricsCollector {
  private buffer: MetricEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;
  
  private readonly batchIntervalMs: number;
  private readonly maxBufferSize: number;
  
  constructor(private readonly config: CollectorConfig) {
    this.batchIntervalMs = config.batchIntervalMs ?? TELEMETRY_CONFIG.BATCH_INTERVAL_MS;
    this.maxBufferSize = config.maxBufferSize ?? TELEMETRY_CONFIG.MAX_BUFFER_SIZE;
    
    this.startFlushTimer();
  }
  
  /**
   * Record a single metric event
   */
  record(event: Omit<MetricEvent, 'timestamp'>): void {
    const fullEvent: MetricEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    this.buffer.push(fullEvent);
    
    // Force flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  /**
   * Record a request metric (convenience method)
   */
  recordRequest(data: {
    method: string;
    path: string;
    status: number;
    duration: number;
    error?: string;
    errorCode?: string;
  }): void {
    this.record({
      method: data.method,
      path: data.path,
      status: data.status,
      duration: data.duration,
      success: data.status < 400,
      error: data.error,
      errorCode: data.errorCode,
    });
  }
  
  /**
     * Flush the buffer to Firestore (non-blocking)
     */
  flush(): void {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    // REALITY CHECK: Stricter validation before starting the async block
    const db = this.config.firestore;
    if (!db || (db as any).type !== 'firestore') {
      // Don't throw an error, just wait for the next interval
      return;
    }

    this.isFlushing = true;
    
    Promise.resolve().then(async () => {
      const events = [...this.buffer];
      this.buffer = [];
      
      try {
        const session = this.aggregateSession(events);
        
        // Use the validated 'db' constant
        const telemetryCollection = collection(db, COLLECTIONS.TELEMETRY);
        await addDoc(telemetryCollection, session);
        
        console.log(`[Sentinel] Flushed ${events.length} events to Firestore`);
      } catch (error) {
        console.error('[Sentinel] Failed to flush telemetry:', error);
        
        // Return events to buffer
        try {
          const remainingCapacity = this.maxBufferSize - this.buffer.length;
          if (remainingCapacity > 0) {
            this.buffer = [...this.buffer, ...events.slice(0, remainingCapacity)];
          }
        } catch (bufferError) {
          console.error('[Sentinel] Buffer recovery failed:', bufferError);
        }
      } finally {
        this.isFlushing = false;
      }
    }).catch(err => {
      console.error('[Sentinel] Flush initialization failed:', err);
      this.isFlushing = false;
    });
  }
  /**
   * Stop the collector and flush remaining events
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    await this.flush();
  }
  
  /**
   * Get current buffer size (for monitoring)
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
  
  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.batchIntervalMs);
    
    // Don't prevent the process from exiting
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }
  
  /**
   * Aggregate events into a telemetry session
   */
  private aggregateSession(events: MetricEvent[]): TelemetrySession {
    const metrics = this.calculateMetrics(events);
    
    return {
      id: this.generateId(),
      timestamp: new Date(),
      source: this.config.source,
      metrics,
      surpriseScore: 0, // Will be calculated by the brain
      status: 'normal', // Will be updated by the brain
      environment: this.config.environment ?? 'development',
      version: this.config.version,
      hostname: process.env.HOSTNAME,
    };
  }
  
  /**
   * Calculate aggregated metrics from events
   */
  private calculateMetrics(events: MetricEvent[]): MetricsSnapshot {
    const durations = events.map(e => e.duration).sort((a, b) => a - b);
    const errors = events.filter(e => !e.success);
    
    return {
      latency: this.calculateLatencyMetrics(durations),
      errors: this.calculateErrorMetrics(errors, events.length),
      requests: this.calculateRequestMetrics(events),
      database: {
        activeConnections: 0, // Populated by DB sensor
        queryTimeAvg: 0,
        slowQueries: 0,
        poolUtilization: 0,
      },
    };
  }
  
  /**
   * Calculate latency percentiles
   */
  private calculateLatencyMetrics(sortedDurations: number[]): LatencyMetrics {
    if (sortedDurations.length === 0) {
      return { p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }
    
    const len = sortedDurations.length;
    
    return {
      p50: sortedDurations[Math.floor(len * 0.5)] ?? 0,
      p95: sortedDurations[Math.floor(len * 0.95)] ?? 0,
      p99: sortedDurations[Math.floor(len * 0.99)] ?? 0,
      min: sortedDurations[0] ?? 0,
      max: sortedDurations[len - 1] ?? 0,
    };
  }
  
  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(errors: MetricEvent[], total: number): ErrorMetrics {
    const types: Record<string, number> = {};
    const recent: ErrorMetrics['recent'] = [];
    
    for (const error of errors) {
      const type = error.errorCode || 'UNKNOWN';
      types[type] = (types[type] ?? 0) + 1;
      
      if (recent.length < 10 && error.error) {
        recent.push({
          message: error.error,
          code: error.errorCode,
          timestamp: error.timestamp,
        });
      }
    }
    
    return {
      count: errors.length,
      rate: total > 0 ? errors.length / total : 0,
      types,
      recent,
    };
  }
  
  /**
   * Calculate request metrics
   */
  private calculateRequestMetrics(events: MetricEvent[]): RequestMetrics {
    const byMethod: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    
    let successful = 0;
    let failed = 0;
    
    for (const event of events) {
      byMethod[event.method] = (byMethod[event.method] ?? 0) + 1;
      byPath[event.path] = (byPath[event.path] ?? 0) + 1;
      
      if (event.success) {
        successful++;
      } else {
        failed++;
      }
    }
    
    return {
      total: events.length,
      successful,
      failed,
      byMethod,
      byPath,
    };
  }
  
  /**
   * Generate a unique session ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Singleton instance (initialized by initSensor)
let collectorInstance: MetricsCollector | null = null;

/**
 * Initialize the global metrics collector
 */
export function initCollector(config: CollectorConfig): MetricsCollector {
  // Relaxed validation: Allow initialization even if DB is still a proxy
  if (!config?.firestore) {
    throw new Error('Firestore instance required for MetricsCollector');
  }
  
  if (!config?.source) {
    throw new Error('Valid telemetry source identifier is required');
  }

  if (collectorInstance) {
    return collectorInstance;
  }
  
  collectorInstance = new MetricsCollector(config);
  return collectorInstance;
}
/**
 * Get the global metrics collector
 */
export function getCollector(): MetricsCollector | null {
  return collectorInstance;
}

/**
 * Record a metric event using the global collector
 */
export function recordMetric(event: Omit<MetricEvent, 'timestamp'>): void {
  if (!collectorInstance) {
    console.warn('[Sentinel] Collector not initialized, metric dropped');
    return;
  }
  
  collectorInstance.record(event);
}
