/**
 * Next.js Middleware for Sentinel
 * 
 * Wraps Next.js API routes to capture telemetry automatically.
 * This is the "Nervous System" entry point for TalentFlow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { recordMetric } from './collector';

/**
 * Options for the Sentinel middleware
 */
export interface SentinelMiddlewareOptions {
  /** Paths to exclude from monitoring */
  excludePaths?: string[];
  /** Paths to include (if specified, only these are monitored) */
  includePaths?: string[];
  /** Whether to capture request bodies */
  captureBody?: boolean;
  /** Custom path normalizer (e.g., to replace IDs with placeholders) */
  normalizePath?: (path: string) => string;
}

/**
 * Default path normalizer
 * Replaces UUIDs and numeric IDs with placeholders
 */
function defaultNormalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

/**
 * Check if a path should be monitored
 */
function shouldMonitor(
  path: string,
  options: SentinelMiddlewareOptions
): boolean {
  const { excludePaths = [], includePaths } = options;
  
  // Check exclusions
  for (const exclude of excludePaths) {
    if (path.startsWith(exclude)) {
      return false;
    }
  }
  
  // Check inclusions (if specified)
  if (includePaths) {
    for (const include of includePaths) {
      if (path.startsWith(include)) {
        return true;
      }
    }
    return false;
  }
  
  return true;
}

/**
 * Create a Sentinel middleware wrapper for Next.js
 * 
 * @example
 * ```typescript
 * // In your API route or middleware.ts
 * import { withSentinel } from '@sentinel/sensor';
 * 
 * export const config = {
 *   matcher: '/api/:path*',
 * };
 * 
 * export default withSentinel();
 * ```
 */
export function withSentinel(options: SentinelMiddlewareOptions = {}) {
  const normalizePath = options.normalizePath ?? defaultNormalizePath;
  
  return async function sentinelMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const path = new URL(request.url).pathname;
    
    // Check if we should monitor this path
    if (!shouldMonitor(path, options)) {
      return NextResponse.next();
    }
    
    // Create a response promise that we can observe
    let response: NextResponse;
    let error: Error | null = null;
    
    try {
      response = NextResponse.next();
    } catch (e) {
      error = e as Error;
      response = NextResponse.next();
    }
    
    // Record the metric after response
    const duration = Date.now() - startTime;
    const normalizedPath = normalizePath(path);
    
    recordMetric({
      method: request.method,
      path: normalizedPath,
      status: response.status,
      duration,
      success: response.status < 400,
      error: error?.message,
      errorCode: error ? String(response.status) : undefined,
    });
    
    return response;
  };
}

/**
 * Wrap an API route handler with Sentinel monitoring
 * 
 * @example
 * ```typescript
 * // In app/api/tasks/route.ts
 * import { withSentinelHandler } from '@sentinel/sensor';
 * 
 * async function handler(request: Request) {
 *   // Your handler logic
 *   return Response.json({ tasks: [] });
 * }
 * 
 * export const GET = withSentinelHandler(handler);
 * ```
 */
export function withSentinelHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: SentinelMiddlewareOptions = {}
): T {
  const normalizePath = options.normalizePath ?? defaultNormalizePath;
  
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    const request = args[0] as Request;
    const path = new URL(request.url).pathname;
    
    let response: Response;
    let error: Error | null = null;
    
    try {
      response = await handler(...args);
    } catch (e) {
      error = e as Error;
      response = new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Schedule telemetry recording WITHOUT blocking
    const duration = Date.now() - startTime;
    const normalizedPath = normalizePath(path);
    
    Promise.resolve().then(() => {
      try {
        recordMetric({
          method: request.method,
          path: normalizedPath,
          status: response.status,
          duration,
          success: response.status < 400,
          error: error?.message,
          errorCode: error ? 'EXCEPTION' : undefined,
        });
      } catch (err) {
        console.error('[Sentinel] Failed to record telemetry:', err);
        // Silently handle errors to avoid affecting the main API
      }
    });
    
    return response;
  }) as T;
}

/**
 * Manual telemetry recording for custom events
 * 
 * @example
 * ```typescript
 * import { recordTelemetry } from '@sentinel/sensor';
 * 
 * // Record a database query
 * const startTime = Date.now();
 * await db.query('SELECT * FROM tasks');
 * recordTelemetry('db_query', { duration: Date.now() - startTime, table: 'tasks' });
 * ```
 */
export function recordTelemetry(
  eventType: string,
  data: Record<string, number | string | boolean>
): void {
  recordMetric({
    method: 'CUSTOM',
    path: `/custom/${eventType}`,
    status: 200,
    duration: typeof data.duration === 'number' ? data.duration : 0,
    success: true,
  });
}
