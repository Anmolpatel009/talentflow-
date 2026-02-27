/**
 * Sentinel-Node Firebase Cloud Functions
 *
 * Handles telemetry processing, anomaly detection, and notifications.
 * This is the serverless "Executive" layer of the system.
 */
import * as functions from 'firebase-functions';
/**
 * Process incoming telemetry and detect anomalies
 *
 * Triggered when a new telemetry document is written to Firestore
 */
export declare const processTelemetry: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
/**
 * Handle anomaly approval from Discord
 *
 * Called when a user approves a remediation action
 */
export declare const approveAnomaly: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Health check endpoint
 */
export declare const healthCheck: functions.HttpsFunction;
//# sourceMappingURL=index.d.ts.map