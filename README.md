# TalentFlow PRT: The Autonomous Service Mesh

**Intent-Driven P2P Marketplace** - A Next.js 14 application where AI agents replace traditional search/filter UI to manage complex geospatial tasks, connecting clients with verified student freelancers within customizable radius.

## 🌟 Overview

TalentFlow PRT (Personalized Resource Tasker) is an evolution of the original TalentFlow platform, transitioning from a manual P2P marketplace to an **Agentic Dispatching System**. AI agents handle intent extraction, semantic matching, and automated negotiation to simplify the task of finding and dispatching freelancers.

### Key Features

- 🧠 **Intent-Driven Matching** - LLM-powered natural language understanding replaces traditional search
- 🔍 **Hybrid Search** - PostGIS geospatial filtering + Azure AI Search semantic re-ranking
- 🤖 **Autonomous Dispatcher** - Semantic Kernel orchestrates agentic workflows
- 📍 **Geospatial Matching** - PostGIS-powered customizable radius task discovery
- ⚡ **Real-time Updates** - Supabase Realtime for live task notifications
- 🔐 **OTP Verification** - In-app 4-digit OTP for task start/end
- 🎯 **Verification System** - Tiered commission (10% verified vs 50% unverified)
- 🗺️ **Privacy-First Location** - Fuzzy location display before task acceptance
- 🔒 **Circuit Breaker** - Fallback to keyword search if LLM intent parsing fails

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Go to **SQL Editor** in Supabase Dashboard
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the SQL to create all tables, functions, and RLS policies

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase and Azure credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AZURE_AI_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_AI_SEARCH_KEY=your-search-key
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
```

### 4. Enable Realtime (Important!)

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Add tables `tasks` and `task_handshakes` to the `supabase_realtime` publication

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
talentflow/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── auth/                     # Authentication
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── signup/page.tsx       # Signup with role selection
│   │   ├── client/                   # Client dashboard & pages
│   │   │   ├── dashboard/page.tsx    # Client task management
│   │   │   ├── profile/page.tsx      # Client profile
│   │   │   └── tasks/
│   │   │       ├── create/page.tsx   # Task creation form
│   │   │       ├── [taskId]/page.tsx # Task details & management
│   │   │       └── [taskId]/payment/ # Payment page (placeholder)
│   │   ├── freelancer/               # Freelancer dashboard & pages
│   │   │   ├── dashboard/page.tsx    # Active tasks & OTP verification
│   │   │   ├── nearby-tasks/page.tsx # Radius-based task discovery
│   │   │   ├── all-tasks/page.tsx    # All available tasks
│   │   │   ├── applications/page.tsx # Mode B applications
│   │   │   └── profile/page.tsx      # Freelancer profile & verification
│   │   ├── messages/[chatId]/        # Real-time chat
│   │   ├── api/                      # API Routes
│   │   │   ├── tasks/
│   │   │   │   ├── nearby/route.ts   # Geospatial task query
│   │   │   │   ├── accept/route.ts   # Race-safe task acceptance
│   │   │   │   ├── status/route.ts   # Status transitions with OTP
│   │   │   │   └── otp/route.ts      # OTP generation & verification
│   │   │   ├── agent/                # Agentic orchestration
│   │   │   │   └── route.ts          # Intent extraction & dispatching
│   │   │   └── vector/               # Vector search
│   │   │       └── route.ts          # Azure AI Search integration
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   └── server.ts             # Server Supabase client
│   │   ├── hooks/
│   │   │   └── useRealtimeTasks.ts   # Real-time task subscriptions
│   │   └── utils/
│   │       ├── geo.ts                # Geospatial utilities
│   │       ├── otp.ts                # OTP generation utilities
│   │       ├── safety.ts             # Content safety filtering
│   │       └── commission.ts         # Commission calculation
│   └── types/
│       └── index.ts                  # TypeScript type definitions
├── supabase/
│   └── schema.sql                    # Complete database schema
├── documents/
│   └── DATABASE_VERIFICATION.md      # DB verification guide
└── plans/
    └── TALENTFLOW_ARCHITECTURE.md    # Architecture documentation
```

---

## 🧠 Agentic System Architecture

### The "Brain" Loop

1. **Intent Extraction**: LLM parses natural language (e.g., "Find a developer in Pune for 2 hours") into a structured JSON schema

2. **Hybrid Retrieval**:
   - **PostGIS**: Hard filter by radius (GIST index on location)
   - **Azure AI Search**: Re-rank results based on semantic skill match (e.g., "React" vs. "Next.js")

3. **Negotiation Agent**: Second agent loop checks the freelancer's "Trust Score" and "Current Load" before recommending

### Orchestration

- **Semantic Kernel (Python SDK)**: Main orchestrator managing agentic workflows
- **Azure AI Search**: Hybrid vector + keyword search engine
- **Azure OpenAI**: Intent extraction and negotiation agents
- **Supabase/PostGIS**: Geospatial filtering and data storage

---

## 🚀 4-Phase Implementation Plan

| Phase | Duration | Milestone | Technical Objective |
|-------|----------|-----------|---------------------|
| 1 | 2 Weeks | Knowledge Vectorization & RAG | Ingest all freelancer bios and 7 categories into Azure AI Search. Implement Hybrid Search (PostGIS + Vector). |
| 2 | 3 Weeks | Reasoning Dispatcher Agent | Implement Semantic Kernel to replace standard search. Agent must extract "Intent" from natural language. |
| 3 | 2 Weeks | Skill/Plugin Registry | Convert Supabase API routes into "Skills" that the Agent can call autonomously via Function Calling. |
| 4 | 2 Weeks | Autonomous IDP | Deploy Azure OpenAI Vision to automate freelancer ID verification (HIPAA/Security-compliant logic). |

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with verification status, location, skills, bio, trust score, current load |
| `tasks` | Task listings with mode, category, budget, geo_location |
| `task_handshakes` | Mode A acceptance tracking (race condition safe) |
| `task_applications` | Mode B proposals with portfolio links |
| `chats` | Real-time chat sessions per task |
| `messages` | Chat messages with safety filtering |
| `task_attachments` | Proof of work uploads |
| `reviews` | Task completion reviews & ratings |
| `sos_alerts` | Emergency alerts during tasks |
| `otps` | 4-digit OTP codes for task verification |

### Key Functions

| Function | Purpose |
|----------|---------|
| `find_nearby_tasks()` | PostGIS-powered radius search |
| `get_fuzzy_location()` | Privacy-preserving location offset (200m) |
| `increment_completed_tasks()` | Update freelancer stats |
| `update_freelancer_rating()` | Recalculate average rating |
| `handle_new_user()` | Auto-create profile on signup |

---

## 🔌 API Endpoints

### Tasks API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks/nearby` | GET | Find tasks within specified radius |
| `/api/tasks/accept` | POST | Accept an immediate task (race-safe) |
| `/api/tasks/status` | POST | Update task status with OTP validation |
| `/api/tasks/otp` | POST | Generate 4-digit OTP |
| `/api/tasks/otp` | GET | Verify OTP code |

### Agentic API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent` | POST | Process natural language intent |
| `/api/vector` | POST | Manage vector embeddings |
| `/api/trust` | GET | Get freelancer trust scores |

### Example Requests

**POST /api/agent**
```json
{
  "intent": "Find a developer in Pune for 2 hours"
}
```

**GET /api/tasks/nearby**
```
GET /api/tasks/nearby?lat=28.6139&lng=77.2090&radius=5000
```

---

## 📱 User Flows

### Client Flow (Agentic)

1. **Sign Up** → Select "Client" role
2. **Describe Task** → Use natural language to describe your requirements
3. **Intent Processing** → LLM extracts structured intent from your description
4. **AI Matching** → System performs hybrid search and negotiation
5. **Review Recommendations** → AI presents best matching freelancers
6. **Approve & Dispatch** → Confirm selection and task is dispatched automatically
7. **Generate Start OTP** → Share with freelancer to begin
8. **Generate End OTP** → Share when work is complete
9. **Mark Complete & Pay** → Redirect to payment page

### Freelancer Flow

1. **Sign Up** → Select "Freelancer" role
2. **Complete Profile** → Add skills, location, and detailed bio
3. **Verify Account** → Upload college ID (optional but recommended)
4. **Profile Vectorization** → System automatically creates embedding for your bio
5. **Receive Task Matches** → AI sends relevant task recommendations
6. **Accept Task** → Mode A: instant acceptance, Mode B: apply first
7. **Get Start OTP** → Request from client, enter to start
8. **Complete Work** → Get End OTP from client
9. **Submit for Review** → Enter End OTP
10. **Receive Payment** → After client marks complete

---

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Clients can only manage their own tasks
- Freelancers can only view/accept available tasks
- OTPs visible only to task participants
- Messages filtered by chat participation

### Content Safety

- Phone numbers masked in chat: `9876543210` → `98xxxxxx10`
- Email addresses masked: `user@email.com` → `u***@email.com`
- Safety flagging for suspicious content

### Location Privacy

- Fuzzy location displayed before task acceptance (200m offset)
- Exact location revealed only after handshake

### OTP System

- 4-digit codes generated in-app (no SMS costs)
- 30-minute expiry
- Single-use with validation

---

## 💰 Commission Structure

| Verification Status | Commission |
|--------------------|------------|
| **Verified** (College ID uploaded) | 10% |
| **Unverified** | 50% |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Auth** | Supabase Auth |
| **Realtime** | Supabase Realtime |
| **Storage** | Supabase Storage |
| **Maps** | OpenStreetMap (no API key needed) |
| **Payments** | Razorpay/Stripe (placeholder) |
| **Orchestrator** | Semantic Kernel (Python SDK) |
| **Vector Engine** | Azure AI Search (Hybrid: Vector + Keyword) |
| **LLM** | Azure OpenAI |
| **Validation** | Pydantic AI |

---

## 💰 Zero-Cost Stack

All services have generous free tiers:

| Service | Free Tier |
|---------|-----------|
| **Supabase** | 50K MAU, 500MB DB, 1GB Storage, 2GB Bandwidth |
| **Vercel** | 100GB bandwidth, unlimited deployments |
| **OpenStreetMap** | Unlimited (no API key required) |
| **Azure AI Search** | 5000 queries/day, 50MB storage |
| **Azure OpenAI** | Free trial available |

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## ✅ Implementation Status

### Current Implementation ✅

#### Phase 1 - Foundation ✅
- [x] Next.js 14 + TypeScript + Tailwind setup
- [x] Database schema with PostGIS
- [x] Authentication flow (signup, login, logout)
- [x] Basic UI components
- [x] Utility functions (geo, safety, otp, commission)

#### Phase 2 - Core Features ✅
- [x] Task creation (Mode A + Mode B)
- [x] Geospatial query engine with PostGIS
- [x] Nearby task discovery (5km radius)
- [x] Real-time task subscriptions
- [x] Verification gate for nearby tasks
- [x] Fuzzy location display (privacy)
- [x] Race condition handling for task acceptance

#### Phase 3 - Task Management ✅
- [x] Task status transitions (open → assigned → in_progress → review → completed)
- [x] OTP generation and verification (4-digit)
- [x] Client dashboard with task management
- [x] Freelancer dashboard with active tasks
- [x] Payment page redirect (placeholder)

#### Phase 4 - Chat & Messaging 🔄
- [x] Chat UI implementation
- [x] Safety filtering for messages
- [ ] Real-time message delivery (needs integration)

#### Phase 5 - Verification & Safety 🔄
- [x] Verification UI on profile page
- [x] SOS alerts schema
- [ ] Document upload for verification
- [ ] SOS button functionality

#### Phase 6 - Payments & Reviews 🔄
- [x] Payment page UI (placeholder)
- [x] Commission calculation logic
- [ ] Razorpay/Stripe integration
- [ ] Escrow system
- [ ] Review system

### Planned Agentic Features 🔄

#### Phase 1 - Knowledge Vectorization & RAG (In Progress)
- [ ] Ingest freelancer bios and categories into Azure AI Search
- [ ] Implement Hybrid Search (PostGIS + Vector)

#### Phase 2 - Reasoning Dispatcher Agent
- [ ] Implement Semantic Kernel for orchestration
- [ ] Build intent extraction from natural language
- [ ] Develop negotiation agent for trust/load checking

#### Phase 3 - Execution Skill/Plugin Registry
- [ ] Convert Supabase API routes into Semantic Kernel Skills
- [ ] Implement function calling for autonomous task execution

#### Phase 4 - Governance Autonomous IDP
- [ ] Deploy Azure OpenAI Vision for automated ID verification
- [ ] Implement HIPAA/Security-compliant logic

---

## 📚 Documentation

- [`plans/TALENTFLOW_ARCHITECTURE.md`](plans/TALENTFLOW_ARCHITECTURE.md) - Detailed architecture documentation
- [`documents/DATABASE_VERIFICATION.md`](documents/DATABASE_VERIFICATION.md) - Database setup verification guide
- [`supabase/schema.sql`](supabase/schema.sql) - Complete database schema

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🆘 Support

For issues or questions:
1. Check the [Database Verification Guide](documents/DATABASE_VERIFICATION.md)
2. Review the [Architecture Documentation](plans/TALENTFLOW_ARCHITECTURE.md)
3. Open an issue on GitHub
