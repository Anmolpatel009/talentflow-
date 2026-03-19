-- =============================================================================
-- TalentFlow Database Schema (Upgraded & Anti-Recursion Optimized)
-- Complete schema for Client & Freelancer Platform
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;      
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE task_mode AS ENUM ('immediate', 'standard');
    CREATE TYPE task_category AS ENUM (
        'content_engine', 'hyper_local_logistics', 'tech_neighbor', 
        'academic_support', 'event_support', 'ai_training', 'digital_assistant'
    );
    CREATE TYPE task_status AS ENUM ('open', 'assigned', 'in_progress', 'review', 'completed', 'disputed', 'cancelled');
    CREATE TYPE verification_status AS ENUM ('none', 'pending', 'verified');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. HELPER FUNCTIONS (The secret to fixing 42P17 Recursion & Performance)
-- These securely fetch IDs without triggering other RLS policies.
CREATE OR REPLACE FUNCTION get_my_profile_id() RETURNS uuid AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_task_client(check_task_id uuid) RETURNS boolean AS $$
    SELECT EXISTS (SELECT 1 FROM public.tasks WHERE id = check_task_id AND client_id = get_my_profile_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_task_freelancer(check_task_id uuid) RETURNS boolean AS $$
    SELECT EXISTS (SELECT 1 FROM public.task_handshakes WHERE task_id = check_task_id AND freelancer_id = get_my_profile_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. TABLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('client', 'freelancer')),
    full_name TEXT,
    phone TEXT,
    city TEXT,
    verification_status verification_status NOT NULL DEFAULT 'none',
    college_id_url TEXT,
    gov_id_url TEXT,
    college_name TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    commission_rate INTEGER NOT NULL DEFAULT 50,
    location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE,
    gear_list JSONB DEFAULT '[]'::jsonb,
    completed_tasks INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mode task_mode NOT NULL DEFAULT 'standard',
    category task_category NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    escrow_amount DECIMAL(10, 2),
    geo_location GEOGRAPHY(POINT, 4326),
    address_text TEXT,
    is_nearby BOOLEAN NOT NULL DEFAULT FALSE,
    status task_status NOT NULL DEFAULT 'open',
    acceptance_deadline TIMESTAMP WITH TIME ZONE,
    portfolio_required BOOLEAN DEFAULT FALSE,
    revision_limit INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS task_handshakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_reason TEXT,
    CONSTRAINT unique_task_freelancer UNIQUE(task_id, freelancer_id) -- Fixes the 409 Conflict
);

CREATE TABLE IF NOT EXISTS task_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    portfolio_links JSONB DEFAULT '[]'::jsonb,
    proposed_budget DECIMAL(10, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'otp')),
    safety_flagged BOOLEAN DEFAULT FALSE,
    safety_filtered_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    is_proof_of_work BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_location GEOGRAPHY(POINT, 4326),
    alert_type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    otp TEXT NOT NULL,
    otp_type TEXT NOT NULL CHECK (otp_type IN ('start', 'end')),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_geo ON tasks USING GIST(geo_location);
CREATE INDEX IF NOT EXISTS idx_task_handshakes_task ON task_handshakes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_task ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_chats_task ON chats(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_reviews_task ON reviews(task_id);

-- 6. BUSINESS LOGIC TRIGGERS (Automated Commission Rates)
CREATE OR REPLACE FUNCTION adjust_commission() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' THEN
    NEW.commission_rate = 10;
  ELSIF NEW.verification_status IN ('none', 'pending') THEN
    NEW.commission_rate = 50;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjust_commission ON profiles;
CREATE TRIGGER trg_adjust_commission
  BEFORE UPDATE OF verification_status ON profiles
  FOR EACH ROW EXECUTE FUNCTION adjust_commission();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role) VALUES (NEW.id, NEW.email, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_modtime ON tasks;
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. CLEAN SLATE FOR RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_handshakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- 8. THE NEW, FLAT RLS POLICIES (No more 42P17 or 42501 errors)

-- Profiles
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Tasks
DROP POLICY IF EXISTS "Users create tasks" ON tasks;
DROP POLICY IF EXISTS "Clients manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Open tasks viewable" ON tasks;
DROP POLICY IF EXISTS "Freelancers with handshake can view tasks" ON tasks;
CREATE POLICY "Clients create tasks" ON tasks FOR INSERT WITH CHECK (client_id = get_my_profile_id());
CREATE POLICY "Clients update own tasks" ON tasks FOR UPDATE USING (client_id = get_my_profile_id());
CREATE POLICY "Tasks visibility" ON tasks FOR SELECT USING (
    status = 'open' 
    OR client_id = get_my_profile_id() 
    OR is_task_freelancer(id)
);

-- Task Handshakes
DROP POLICY IF EXISTS "Freelancers create handshakes" ON task_handshakes;
DROP POLICY IF EXISTS "Participants view handshakes" ON task_handshakes;
CREATE POLICY "Freelancers manage own handshakes" ON task_handshakes FOR ALL USING (freelancer_id = get_my_profile_id());
CREATE POLICY "Clients view handshakes on their tasks" ON task_handshakes FOR SELECT USING (is_task_client(task_id));

-- Task Applications
DROP POLICY IF EXISTS "Freelancers apply" ON task_applications;
DROP POLICY IF EXISTS "Participants view applications" ON task_applications;
CREATE POLICY "Freelancers manage own applications" ON task_applications FOR ALL USING (freelancer_id = get_my_profile_id());
CREATE POLICY "Clients view applications on their tasks" ON task_applications FOR SELECT USING (is_task_client(task_id));

-- Chats & Messages (Secured via Helper Functions)
DROP POLICY IF EXISTS "Participants view chats" ON chats;
CREATE POLICY "Chat visibility" ON chats FOR SELECT USING (is_task_client(task_id) OR is_task_freelancer(task_id));

DROP POLICY IF EXISTS "Participants view messages" ON messages;
DROP POLICY IF EXISTS "Participants send messages" ON messages;
CREATE POLICY "Message visibility" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE id = messages.chat_id AND (is_task_client(task_id) OR is_task_freelancer(task_id)))
);
CREATE POLICY "Send messages" ON messages FOR INSERT WITH CHECK (sender_id = get_my_profile_id());

-- Reviews, SOS, OTPs (Simplified)
CREATE POLICY "Review visibility" ON reviews FOR SELECT USING (true);
CREATE POLICY "Create reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = get_my_profile_id());

CREATE POLICY "SOS visibility" ON sos_alerts FOR SELECT USING (user_id = get_my_profile_id() OR is_task_client(task_id));
CREATE POLICY "Create SOS" ON sos_alerts FOR INSERT WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "OTP visibility" ON otps FOR SELECT USING (is_task_client(task_id) OR is_task_freelancer(task_id));
CREATE POLICY "Create OTP" ON otps FOR INSERT WITH CHECK (is_task_client(task_id));