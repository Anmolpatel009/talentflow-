# TalentFlow v1.0

**Hyper-Local Student Freelancer Marketplace** - A Next.js 14 application connecting clients with verified student freelancers.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in Supabase Dashboard
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create all tables and functions

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

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
talentflow/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── auth/               # Authentication pages
│   │   ├── client/             # Client dashboard & pages
│   │   ├── freelancer/         # Freelancer dashboard & pages
│   │   ├── api/                # API routes
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/              # React components
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   └── utils/              # Utility functions
│   └── types/                   # TypeScript types
├── supabase/
│   └── schema.sql              # Database schema
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema

The database includes these core tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with verification status |
| `tasks` | Task listings with mode & category |
| `task_handshakes` | Mode A acceptance tracking |
| `task_applications` | Mode B proposals |
| `chats` | Real-time chat sessions |
| `messages` | Chat messages with safety filtering |
| `task_attachments` | Proof of work uploads |
| `reviews` | Task completion reviews |
| `sos_alerts` | Emergency alerts |
| `otps` | In-app OTP codes |

---

## 💰 Zero-Cost Stack

All services have generous free tiers:

| Service | Free Tier |
|---------|-----------|
| **Supabase** | 50K MAU, 500MB DB, 1GB Storage |
| **Vercel** | 100GB bandwidth |
| **OpenStreetMap** | Unlimited (no API key) |
| **Razorpay/Stripe** | Test mode (free during dev) |

---

## 📱 Features Implemented

### Phase 1 - Foundation ✅
- [x] Next.js 14 + TypeScript + Tailwind setup
- [x] Database schema with PostGIS
- [x] Authentication flow
- [x] Basic UI components
- [x] Utility functions (geo, safety, otp, commission)

### Phase 2 - Core Features (In Progress)
- [ ] Task creation (Mode A + B)
- [ ] Geospatial query engine
- [ ] Nearby task discovery

### Phase 3 - Real-time System
- [ ] First-accept race condition handling
- [ ] Supabase Realtime subscriptions
- [ ] Chat system with safety filtering

### Phase 4 - Verification & Safety
- [ ] Document upload for verification
- [ ] In-app OTP system
- [ ] SOS button

### Phase 5 - Payments & Reviews
- [ ] Payment integration
- [ ] Escrow logic
- [ ] Review system

---

## 🔒 Security Features

- **Row Level Security (RLS)** on all tables
- **Chat safety filtering** - masks phone numbers & contact info
- **In-app OTP** - no SMS costs, works offline
- **Location privacy** - fuzzy location before acceptance

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate TypeScript types from DB
npm run db:migrate   # Push schema to database
```

---

## 📄 License

MIT
