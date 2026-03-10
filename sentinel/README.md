# Sentinel-Node

> Self-hosted SRE agent that regulates your application like a cybernetic governor

## The Elevator Pitch for Developers

Stop setting static alert rules like "CPU > 80%". Sentinel-Node creates a **generative model of your app's normal behavior** and calculates the "surprise" of every incoming metric. If the surprise is too high, it doesn't just ping you on Discord—it **suggests or executes a fix based on the specific error pattern**.

## Why Sentinel-Node?

### Cost: $0 Budget
Uses Firebase Cloud Functions and Firestore - both have generous free tiers.

### Autonomy: It's a Doctor, Not a Mirror
Traditional monitoring tools show you what's happening. Sentinel-Node tells you how to fix it.

### Privacy: Your Data Stays Yours
All telemetry stays in your Firebase/infrastructure. No third-party services.

### Simplicity: No PhD Required
Built with TypeScript/Node.js and basic statistics. If you understand mean, variance, and webhooks, you can build this.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Cybernetic SRE Agent                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Sensor      │───▶│  Brain       │───▶│  Actuator    │       │
│  │  (Nervous    │    │  (Governor)  │    │  (Muscles)   │       │
│  │  System)     │    │              │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                     │                     │            │
│         ▼                     ▼                     ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Firestore   │    │  Hourly      │    │  Webhooks    │       │
│  │  (Memory)    │    │  Profiles    │    │  (Actions)   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Packages

### `@sentinel/core`
Core types, constants, and utilities shared across all packages.

### `@sentinel/sensor`
**Nervous System** - Telemetry collection middleware for Next.js. Captures request metrics with a 60-second moving window aggregator.

### `@sentinel/brain`
**Governor** - Firestore Cloud Functions that:
## Quick Start

### Prerequisites

- Node.js 18+
- Firebase account (Spark plan is free)
- Discord bot token (optional, for notifications)

### Installation

```bash
# From the sentinel directory
cd sentinel
npm install
```

### Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Fill in your Firebase configuration:
```env
FIREBASE_PROJECT_ID=your-project-id
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
ACTUATOR_URL=http://localhost:3001
```

### Development

```bash
# Build all packages
npm run build

# Start Firebase emulators for local development
npm run emulator

# Deploy to Firebase
npm run deploy
```

## Integration with TalentFlow

### 1. Install the sensor package

```bash
cd talentflow
npm install @sentinel/sensor
```

### 2. Initialize the sensor

```typescript
// src/lib/sentinel.ts
import { initCollector } from '@sentinel/sensor';
import { getFirestore } from 'firebase/firestore';

const firestore = getFirestore(firebaseApp);

export const sentinel = initCollector({
  firestore,
  source: 'talentflow-api',
  environment: process.env.NODE_ENV,
});
```

### 3. Wrap your API routes

```typescript
// src/app/api/tasks/route.ts
import { withSentinelHandler } from '@sentinel/sensor';

async function handler(request: Request) {
  // Your handler logic
  return Response.json({ tasks: [] });
}

export const GET = withSentinelHandler(handler);
```

## How It Works

### Active Inference

The system maintains an internal model of "normal" behavior. When new observations deviate significantly from this model, it calculates a "surprise" score:

```
S = -ln(P(observation | model))
```

- **S < 0.4**: Normal operation
- **0.4 ≤ S < 0.7**: Warning - anomaly detected
- **S ≥ 0.7**: Critical - immediate attention needed

### Self-Healing Flow

```
1. Sensor captures metrics → Firestore
2. Cloud Function triggers on new telemetry
3. Brain calculates surprise score
4. If anomaly detected:
   - Low risk → Auto-remediate
   - High risk → Discord notification for approval
5. Actuator executes remediation
6. Model updates (learning)
```

## Free Tier Limits

| Service | Free Limit | Strategy |
|---------|------------|----------|
| Firestore | 50k reads/day, 20k writes/day | Batch writes every 30s |
| Cloud Functions | 125k calls/month | Trigger only on new telemetry |
| Hosting | 10GB/month | Dashboard only |

## License

MIT
