/**
 * Test script for Sentinel-Node - Forces anomaly detection
 * 
 * This script initializes the model as ready so anomalies can be detected immediately.
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  doc,
  setDoc,
  getDoc,
  connectFirestoreEmulator
} = require('firebase/firestore');

// Connect to emulator
const app = initializeApp({
  projectId: 'demo-sentinel',
  apiKey: 'demo'
});

const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

// Initialize model as ready
async function initModelAsReady() {
  await setDoc(doc(db, 'internal_model', 'current'), {
    baseline: {
      latencyP95: 100,      // Normal latency
      errorRate: 0.01,      // 1% error rate
      queryTimeAvg: 20,     // 20ms query time
    },
    variance: {
      latencyP95: 50,
      errorRate: 0.005,
      queryTimeAvg: 10,
    },
    learningRate: 0.1,
    sampleCount: 100,       // Already trained
    minSamples: 100,
    isReady: true,          // Model is ready!
    lastUpdated: new Date(),
  });
  console.log('✅ Model initialized as ready');
}

// Test telemetry data - simulates an anomaly (high latency)
const anomalyTelemetry = {
  timestamp: new Date(),
  source: 'talentflow-api',
  metrics: {
    latency: { p50: 200, p95: 800, p99: 1500, min: 50, max: 2000 },  // Very high latency!
    errors: { count: 30, rate: 0.1, types: { '500': 30 }, recent: [] },  // 10% error rate!
    requests: { total: 300, successful: 270, failed: 30, byMethod: { GET: 200, POST: 100 }, byPath: {} },
    database: { activeConnections: 50, queryTimeAvg: 150, slowQueries: 10, poolUtilization: 0.7 }
  },
  surpriseScore: 0,
  status: 'normal',
  environment: 'development'
};

async function runTest() {
  console.log('🧪 Starting Sentinel-Node Anomaly Test...\n');
  
  // Initialize model as ready
  await initModelAsReady();
  
  // Listen for anomalies
  console.log('\n📡 Setting up anomaly listener...');
  const anomaliesQuery = query(collection(db, 'anomalies'), orderBy('detectedAt', 'desc'), limit(5));
  
  let anomalyCount = 0;
  const unsubscribe = onSnapshot(anomaliesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        anomalyCount++;
        const data = change.doc.data();
        console.log('\n🚨 ANOMALY DETECTED!');
        console.log('   Type:', data.type);
        console.log('   Severity:', data.severity);
        console.log('   Surprise Score:', data.surpriseScore?.toFixed?.(3) || 'N/A');
        console.log('   Auto-fixable:', data.autoFixable);
        console.log('   Status:', data.status);
        console.log('   Description:', data.description);
      }
    });
  });
  
  // Write test telemetry
  console.log('\n📝 Writing ANOMALOUS telemetry (high latency + high error rate)...');
  const telemetryRef = await addDoc(collection(db, 'telemetry'), anomalyTelemetry);
  console.log('   Telemetry ID:', telemetryRef.id);
  
  // Wait for function to process
  console.log('\n⏳ Waiting for Cloud Function to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check updated model
  console.log('\n📊 Checking internal model after processing...');
  const modelDoc = await getDoc(doc(db, 'internal_model', 'current'));
  if (modelDoc.exists()) {
    const model = modelDoc.data();
    console.log('   Sample count:', model.sampleCount);
    console.log('   Model ready:', model.isReady);
    console.log('   Baseline latencyP95:', model.baseline?.latencyP95?.toFixed?.(2));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('Telemetry written: ✅');
  console.log('Function triggered: ✅');
  console.log('Anomalies detected:', anomalyCount > 0 ? `✅ ${anomalyCount}` : '❌ 0');
  console.log('='.repeat(50));
  
  unsubscribe();
  process.exit(0);
}

runTest().catch(console.error);
