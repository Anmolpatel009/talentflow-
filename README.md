# TalentFlow

**Hyper-Local Student Freelancer Marketplace** - A Next.js 14 application connecting clients with verified student freelancers within a 5km radius.

## 🌟 Overview

TalentFlow is a gig economy platform designed specifically for student freelancers. It features two task modes:

- **Mode A (Immediate)**: First-come-first-served tasks with instant acceptance
- **Mode B (Standard)**: Traditional proposal/bidding system

### Key Features

- 📍 **Geospatial Matching** - PostGIS-powered 5km radius task discovery
- ⚡ **Real-time Updates** - Supabase Realtime for live task notifications
- 🔐 **OTP Verification** - In-app 4-digit OTP for task start/end
- 🎯 **Verification System** - Tiered commission (10% verified vs 50% unverified)
- 🗺️ **Privacy-First Location** - Fuzzy location display before task acceptance

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

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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
│   │   │   ├── nearby-tasks/page.tsx # 5km radius task discovery
│   │   │   ├── all-tasks/page.tsx    # All available tasks
│   │   │   ├── applications/page.tsx # Mode B applications
│   │   │   └── profile/page.tsx      # Freelancer profile & verification
│   │   ├── messages/[chatId]/        # Real-time chat
│   │   ├── api/                      # API Routes
│   │   │   └── tasks/
│   │   │       ├── nearby/route.ts   # Geospatial task query
│   │   │       ├── accept/route.ts   # Race-safe task acceptance
│   │   │       ├── status/route.ts   # Status transitions with OTP
│   │   │       └── otp/route.ts      # OTP generation & verification
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

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with verification status, location, skills |
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
| `find_nearby_tasks()` | PostGIS-powered 5km radius search |
| `get_fuzzy_location()` | Privacy-preserving location offset (200m) |
| `increment_completed_tasks()` | Update freelancer stats |
| `update_freelancer_rating()` | Recalculate average rating |
| `handle_new_user()` | Auto-create profile on signup |

---

## 🔌 API Endpoints

### Tasks API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks/nearby` | GET | Find tasks within 5km radius |
| `/api/tasks/accept` | POST | Accept an immediate task (race-safe) |
| `/api/tasks/status` | POST | Update task status with OTP validation |
| `/api/tasks/otp` | POST | Generate 4-digit OTP |
| `/api/tasks/otp` | GET | Verify OTP code |

### Example Requests

**GET /api/tasks/nearby**
```
GET /api/tasks/nearby?lat=28.6139&lng=77.2090&radius=5000
```

**POST /api/tasks/accept**
```json
{
  "taskId": "uuid-here"
}
```

**POST /api/tasks/status**
```json
{
  "taskId": "uuid-here",
  "newStatus": "in_progress",
  "otp": "1234"
}
```

**POST /api/tasks/otp**
```json
{
  "taskId": "uuid-here",
  "otpType": "start"
}
```

---

## 📱 User Flows

### Client Flow

1. **Sign Up** → Select "Client" role
2. **Create Task** → Choose Mode A (Immediate) or Mode B (Standard)
3. **For Mode A**: Wait for freelancer to accept
4. **For Mode B**: Review applications, select freelancer
5. **Generate Start OTP** → Share with freelancer to begin
6. **Generate End OTP** → Share when work is complete
7. **Mark Complete & Pay** → Redirect to payment page

### Freelancer Flow

1. **Sign Up** → Select "Freelancer" role
2. **Complete Profile** → Add skills, location
3. **Verify Account** → Upload college ID (optional but recommended)
4. **Find Tasks** → Browse nearby (5km) or all tasks
5. **Accept Task** → Mode A: instant acceptance, Mode B: apply first
6. **Get Start OTP** → Request from client, enter to start
7. **Complete Work** → Get End OTP from client
8. **Submit for Review** → Enter End OTP
9. **Receive Payment** → After client marks complete

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

---

## 💰 Zero-Cost Stack

All services have generous free tiers:

| Service | Free Tier |
|---------|-----------|
| **Supabase** | 50K MAU, 500MB DB, 1GB Storage, 2GB Bandwidth |
| **Vercel** | 100GB bandwidth, unlimited deployments |
| **OpenStreetMap** | Unlimited (no API key required) |

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

### Phase 1 - Foundation ✅
- [x] Next.js 14 + TypeScript + Tailwind setup
- [x] Database schema with PostGIS
- [x] Authentication flow (signup, login, logout)
- [x] Basic UI components
- [x] Utility functions (geo, safety, otp, commission)

### Phase 2 - Core Features ✅
- [x] Task creation (Mode A + Mode B)
- [x] Geospatial query engine with PostGIS
- [x] Nearby task discovery (5km radius)
- [x] Real-time task subscriptions
- [x] Verification gate for nearby tasks
- [x] Fuzzy location display (privacy)
- [x] Race condition handling for task acceptance

### Phase 3 - Task Management ✅
- [x] Task status transitions (open → assigned → in_progress → review → completed)
- [x] OTP generation and verification (4-digit)
- [x] Client dashboard with task management
- [x] Freelancer dashboard with active tasks
- [x] Payment page redirect (placeholder)

### Phase 4 - Chat & Messaging 🔄
- [x] Chat UI implementation
- [x] Safety filtering for messages
- [ ] Real-time message delivery (needs integration)

### Phase 5 - Verification & Safety 🔄
- [x] Verification UI on profile page
- [x] SOS alerts schema
- [ ] Document upload for verification
- [ ] SOS button functionality

### Phase 6 - Payments & Reviews 🔄
- [x] Payment page UI (placeholder)
- [x] Commission calculation logic
- [ ] Razorpay/Stripe integration
- [ ] Escrow system
- [ ] Review system

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
