/**
 * Sentinel-Node Firebase Cloud Functions
 * 
 * Handles telemetry processing, anomaly detection, and notifications.
 * This is the serverless "Executive" layer of the system.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const fieldValue = FieldValue;

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  warningThreshold: 0.4,
  criticalThreshold: 0.7,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  actuatorUrl: process.env.ACTUATOR_URL || 'http://localhost:3001',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Gaussian surprise score
 */
function calculateSurprise(
  observed: Record<string, number>,
  baseline: Record<string, number>,
  variance: Record<string, number>
): number {
  const surprises: number[] = [];
  
  for (const key of Object.keys(baseline)) {
    const obs = observed[key] ?? 0;
    const exp = baseline[key];
    const var_ = variance[key] ?? 1;
    
    if (var_ <= 0) continue;
    
    const zScore = Math.abs(obs - exp) / Math.sqrt(var_);
    const surprise = 1 - Math.exp(-0.5 * zScore * zScore);
    surprises.push(surprise);
  }
  
  if (surprises.length === 0) return 0;
  return surprises.reduce((a, b) => a + b, 0) / surprises.length;
}

/**
 * Determine anomaly type from metrics
 */
function determineAnomalyType(metrics: any): string {
  if (metrics.errors?.rate >= 0.05) return 'error_rate_high';
  if (metrics.latency?.p95 >= 500) return 'latency_spike';
  if (metrics.database?.slowQueries >= 10) return 'db_slow_queries';
  if (metrics.database?.poolUtilization >= 0.8) return 'connection_exhaustion';
  return 'latency_spike';
}

/**
 * Determine severity from surprise score
 */
function determineSeverity(surpriseScore: number): string {
  if (surpriseScore >= CONFIG.criticalThreshold) return 'critical';
  if (surpriseScore >= CONFIG.warningThreshold) return 'high';
  return 'medium';
}

/**
 * Generate remediation suggestion
 */
function suggestRemediation(type: string): { action: string; riskLevel: string } {
  const actions: Record<string, { action: string; riskLevel: string }> = {
    latency_spike: { action: 'cache_flush', riskLevel: 'low' },
    error_rate_high: { action: 'restart_service', riskLevel: 'medium' },
    db_slow_queries: { action: 'db_vacuum', riskLevel: 'medium' },
    connection_exhaustion: { action: 'connection_pool_reset', riskLevel: 'high' },
  };
  
  return actions[type] ?? { action: 'custom_script', riskLevel: 'medium' };
}

/**
 * Send Discord notification
 */
async function sendDiscordNotification(anomaly: any): Promise<void> {
  if (!CONFIG.discordWebhookUrl) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }
  
  const embed = {
    title: `🚨 Anomaly Detected: ${anomaly.type}`,
    description: anomaly.description,
    color: anomaly.severity === 'critical' ? 0xFF0000 : 0xFFA500,
    fields: [
      { name: 'Surprise Score', value: anomaly.surpriseScore.toFixed(3), inline: true },
      { name: 'Severity', value: anomaly.severity, inline: true },
      { name: 'Auto-fixable', value: anomaly.autoFixable ? '✅ Yes' : '❌ No', inline: true },
      { name: 'Suggested Action', value: anomaly.remediationAction?.type ?? 'N/A' },
    ],
    timestamp: new Date().toISOString(),
  };
  
  try {
    await fetch(CONFIG.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}

/**
 * Trigger actuator for auto-remediation
 */
async function triggerActuator(anomalyId: string, action: any): Promise<void> {
  try {
    await fetch(`${CONFIG.actuatorUrl}/execute/${anomalyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  } catch (error) {
    console.error('Failed to trigger actuator:', error);
  }
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * Process incoming telemetry and detect anomalies
 * 
 * Triggered when a new telemetry document is written to Firestore
 */
export const processTelemetry = functions.firestore
  .document('telemetry/{sessionId}')
  .onCreate(async (snap, context) => {
    const telemetry = snap.data();
    
    console.log(`Processing telemetry session: ${context.params.sessionId}`);
    
    try {
      // Get the current internal model
      const modelDoc = await db.collection('internal_model').doc('current').get();
      const model = modelDoc.exists ? modelDoc.data() : null;
      
      // Calculate surprise score
      let surpriseScore = 0;
      
      if (model && model.isReady) {
        const observed = {
          latencyP95: telemetry.metrics?.latency?.p95 ?? 0,
          errorRate: telemetry.metrics?.errors?.rate ?? 0,
          queryTimeAvg: telemetry.metrics?.database?.queryTimeAvg ?? 0,
        };
        
        surpriseScore = calculateSurprise(
          observed,
          model.baseline,
          model.variance
        );
      }
      
      // Update telemetry with surprise score
      const status = surpriseScore >= CONFIG.criticalThreshold ? 'critical'
        : surpriseScore >= CONFIG.warningThreshold ? 'warning'
        : 'normal';
      
      await snap.ref.update({
        surpriseScore,
        status,
        processedAt: fieldValue.serverTimestamp(),
      });
      
      // Check for anomaly
      if (surpriseScore >= CONFIG.warningThreshold) {
        console.log(`Anomaly detected! Surprise score: ${surpriseScore}`);
        
        // Determine anomaly details
        const type = determineAnomalyType(telemetry.metrics);
        const severity = determineSeverity(surpriseScore);
        const remediation = suggestRemediation(type);
        
        // Create anomaly record
        const anomalyRef = await db.collection('anomalies').add({
          detectedAt: fieldValue.serverTimestamp(),
          type,
          severity,
          description: `${type.replace(/_/g, ' ')} detected with surprise score ${surpriseScore.toFixed(3)}`,
          metricsSnapshot: telemetry.metrics,
          surpriseScore,
          autoFixable: remediation.riskLevel === 'low',
          remediationAction: {
            type: remediation.action,
            target: 'system',
            parameters: {},
            riskLevel: remediation.riskLevel,
            estimatedImpact: 'Automated remediation',
          },
          status: remediation.riskLevel === 'low' ? 'approved' : 'pending',
          telemetrySessionId: context.params.sessionId,
        });
        
        // Send notification or auto-remediate
        if (remediation.riskLevel === 'low') {
          // Auto-execute low-risk remediations
          await triggerActuator(anomalyRef.id, remediation);
        } else {
          // Send Discord notification for human approval
          await sendDiscordNotification({
            id: anomalyRef.id,
            type,
            severity,
            surpriseScore,
            autoFixable: false,
            remediationAction: { type: remediation.action },
            description: `${type.replace(/_/g, ' ')} detected`,
          });
        }
      }
      
      // Update the internal model (learning)
      if (model) {
        const lr = model.learningRate ?? 0.1;
        const newBaseline = { ...model.baseline };
        const newVariance = { ...model.variance };
        
        // Update baseline with exponential moving average
        if (telemetry.metrics?.latency?.p95) {
          newBaseline.latencyP95 = lr * telemetry.metrics.latency.p95 + (1 - lr) * model.baseline.latencyP95;
        }
        if (telemetry.metrics?.errors?.rate !== undefined) {
          newBaseline.errorRate = lr * telemetry.metrics.errors.rate + (1 - lr) * model.baseline.errorRate;
        }
        
        await db.collection('internal_model').doc('current').update({
          baseline: newBaseline,
          variance: newVariance,
          sampleCount: fieldValue.increment(1),
          lastUpdated: fieldValue.serverTimestamp(),
        });
      } else {
        // Initialize model if it doesn't exist
        await db.collection('internal_model').doc('current').set({
          baseline: {
            latencyP95: telemetry.metrics?.latency?.p95 ?? 100,
            errorRate: telemetry.metrics?.errors?.rate ?? 0.01,
            queryTimeAvg: telemetry.metrics?.database?.queryTimeAvg ?? 20,
          },
          variance: {
            latencyP95: 100,
            errorRate: 0.001,
            queryTimeAvg: 10,
          },
          learningRate: 0.1,
          sampleCount: 1,
          minSamples: 100,
          isReady: false,
          lastUpdated: fieldValue.serverTimestamp(),
        });
      }
      
    } catch (error) {
      console.error('Error processing telemetry:', error);
    }
  });

/**
 * Handle anomaly approval from Discord
 * 
 * Called when a user approves a remediation action
 */
export const approveAnomaly = functions.https.onCall(async (data, context) => {
  const { anomalyId, approvedBy } = data;
  
  if (!anomalyId) {
    throw new functions.https.HttpsError('invalid-argument', 'anomalyId is required');
  }
  
  const anomalyDoc = await db.collection('anomalies').doc(anomalyId).get();
  
  if (!anomalyDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Anomaly not found');
  }
  
  const anomaly = anomalyDoc.data();
  
  // Update anomaly status
  await anomalyDoc.ref.update({
    status: 'approved',
    approvedBy: approvedBy ?? 'unknown',
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Trigger actuator
  if (anomaly?.remediationAction) {
    await triggerActuator(anomalyId, anomaly.remediationAction);
  }
  
  return { success: true, message: 'Anomaly approved and remediation triggered' };
});

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});
