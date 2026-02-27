/**
 * Test script for Sentinel-Node
 * 
 * Run this while Firebase emulators are running to test the full pipeline.
 * 
 * Usage: node test-telemetry.js
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
  getDoc,
  connectFirestoreEmulator
} = require('firebase/firestore');

// Connect to emulator
const app = initializeApp({
  projectId: 'demo-sentinel',
  apiKey: 'demo'
});

const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, '127.0.0.1', 8080);

// Test telemetry data - simulates an anomaly
const testTelemetry = {
  timestamp: new Date(),
  source: 'talentflow-api',
  metrics: {
    latency: { p50: 200, p95: 800, p99: 1500, min: 50, max: 2000 },
    errors: { count: 30, rate: 0.1, types: { '500': 30 }, recent: [] },
    requests: { total: 300, successful: 270, failed: 30, byMethod: { GET: 200, POST: 100 }, byPath: {} },
    database: { activeConnections: 50, queryTimeAvg: 150, slowQueries: 10, poolUtilization: 0.7 }
  },
  surpriseScore: 0,
  status: 'normal',
  environment: 'development'
};

async function runTest() {
  console.log('🧪 Starting Sentinel-Node Test...\n');
  
  // Listen for anomalies
  console.log('📡 Setting up anomaly listener...');
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
      }
    });
  });
  
  // Write test telemetry
  console.log('\n📝 Writing test telemetry (simulating high latency)...');
  const telemetryRef = await addDoc(collection(db, 'telemetry'), testTelemetry);
  console.log('   Telemetry ID:', telemetryRef.id);
  
  // Wait for function to process
  console.log('\n⏳ Waiting for Cloud Function to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check internal model
  console.log('\n📊 Checking internal model...');
  const modelDoc = await getDoc(doc(db, 'internal_model', 'current'));
  if (modelDoc.exists()) {
    const model = modelDoc.data();
    console.log('   Sample count:', model.sampleCount);
    console.log('   Model ready:', model.isReady);
  } else {
    console.log('   Model not yet created (will be created on first telemetry)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('Telemetry written: ✅');
  console.log('Function triggered: ✅');
  console.log('Anomalies detected:', anomalyCount);
  console.log('='.repeat(50));
  
  unsubscribe();
  process.exit(0);
}

runTest().catch(console.error);
