-- =============================================================================
-- TalentFlow Database Schema
-- Complete schema for Client & Freelancer Platform
-- Last Updated: 2024-01-01
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;      -- For geospatial queries
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- For UUID generation

-- =============================================================================
-- ENUMS
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE task_mode AS ENUM ('immediate', 'standard');
    CREATE TYPE task_category AS ENUM (
        'content_engine', 
        'hyper_local_logistics', 
        'tech_neighbor', 
        'academic_support', 
        'event_support', 
        'ai_training', 
        'digital_assistant'
    );
    CREATE TYPE task_status AS ENUM ('open', 'assigned', 'in_progress', 'review', 'completed', 'disputed', 'cancelled');
    CREATE TYPE verification_status AS ENUM ('none', 'pending', 'verified');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLE: profiles
-- Stores user profiles for both clients and freelancers
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('client', 'freelancer')),
    full_name TEXT,
    phone TEXT,
    city TEXT,
    
    -- Verification fields
    verification_status verification_status NOT NULL DEFAULT 'none',
    college_id_url TEXT,
    gov_id_url TEXT,
    college_name TEXT,
    
    -- Skills for freelancers (JSON array)
    skills JSONB DEFAULT '[]'::jsonb,
    
    -- Commission rate (10% for verified freelancers, 50% for others)
    commission_rate INTEGER NOT NULL DEFAULT 50,
    
    -- Location for geospatial queries
    location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    -- Equipment list for freelancers
    gear_list JSONB DEFAULT '[]'::jsonb,
    
    -- Stats
    completed_tasks INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABLE: tasks
-- Job postings created by clients
-- =============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mode task_mode NOT NULL DEFAULT 'standard',
    category task_category NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    escrow_amount DECIMAL(10, 2),
    
    -- Location for nearby task matching
    geo_location GEOGRAPHY(POINT, 4326),
    address_text TEXT,
    is_nearby BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Task status
    status task_status NOT NULL DEFAULT 'open',
    
    -- Requirements
    acceptance_deadline TIMESTAMP WITH TIME ZONE,
    portfolio_required BOOLEAN DEFAULT FALSE,
    revision_limit INTEGER DEFAULT 2,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- TABLE: task_handshakes
-- Direct task assignments (client selects freelancer directly)
-- =============================================================================
CREATE TABLE IF NOT EXISTS task_handshakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_reason TEXT,
    UNIQUE(task_id, freelancer_id)
);

-- =============================================================================
-- TABLE: task_applications
-- Freelancer applications to open tasks
-- =============================================================================
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

-- =============================================================================
-- TABLE: chats
-- Chat rooms for task-related communication
-- =============================================================================
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABLE: messages
-- Individual messages in chats
-- =============================================================================
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

-- =============================================================================
-- TABLE: task_attachments
-- Files attached to tasks or messages
-- =============================================================================
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

-- =============================================================================
-- TABLE: reviews
-- Task reviews/ratings
-- =============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABLE: sos_alerts
-- Emergency alerts during tasks
-- =============================================================================
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

-- =============================================================================
-- TABLE: otps
-- One-time passwords for task start/completion
-- =============================================================================
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    otp TEXT NOT NULL,
    otp_type TEXT NOT NULL CHECK (otp_type IN ('start', 'end')),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES
-- =============================================================================
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

-- =============================================================================
-- FUNCTION: find_nearby_tasks
-- Returns tasks within a specified radius of user location
-- =============================================================================
CREATE OR REPLACE FUNCTION find_nearby_tasks(
    user_lat double precision, 
    user_lng double precision, 
    radius_meters double precision DEFAULT 5000
)
RETURNS TABLE (
    id uuid, 
    title text, 
    budget decimal, 
    category text, 
    mode text, 
    distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.budget, t.category::text, t.mode::text,
         ST_Distance(t.geo_location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) as distance_meters
  FROM tasks t
  WHERE t.status = 'open' AND t.is_nearby = true
    AND ST_DWithin(t.geo_location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_meters)
    AND (t.acceptance_deadline IS NULL OR t.acceptance_deadline > NOW())
  ORDER BY distance_meters ASC LIMIT 50;
END;
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
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

-- Profiles: Public read, users manage own
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks: Clients manage own, open tasks public
CREATE POLICY "Users create tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = client_id)
);
CREATE POLICY "Clients manage own tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = client_id)
);
CREATE POLICY "Open tasks viewable" ON tasks FOR SELECT USING (status = 'open');

-- Task Handshakes
CREATE POLICY "Freelancers create handshakes" ON task_handshakes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = freelancer_id)
);
CREATE POLICY "Participants view handshakes" ON task_handshakes FOR SELECT USING (
    freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
    OR task_id IN (SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Task Applications
CREATE POLICY "Freelancers apply" ON task_applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = freelancer_id)
);
CREATE POLICY "Participants view applications" ON task_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (id = freelancer_id OR id IN (SELECT client_id FROM tasks WHERE id = task_id)))
);

-- Chats
CREATE POLICY "Participants view chats" ON chats FOR SELECT USING (
    task_id IN (
        SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        UNION ALL 
        SELECT task_id FROM task_handshakes WHERE freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

-- Messages
CREATE POLICY "Participants view messages" ON messages FOR SELECT USING (
    chat_id IN (
        SELECT id FROM chats WHERE task_id IN (
            SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            UNION ALL 
            SELECT task_id FROM task_handshakes WHERE freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
);
CREATE POLICY "Participants send messages" ON messages FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Task Attachments
CREATE POLICY "Participants view attachments" ON task_attachments FOR SELECT USING (
    task_id IN (
        SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        UNION ALL 
        SELECT task_id FROM task_handshakes WHERE freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

-- Reviews
CREATE POLICY "Users view reviews" ON reviews FOR SELECT USING (
    reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
    OR reviewee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (
    reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- SOS Alerts
CREATE POLICY "Users view own sos" ON sos_alerts FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users create sos" ON sos_alerts FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- OTPs
CREATE POLICY "Participants view otps" ON otps FOR SELECT USING (
    task_id IN (
        SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        UNION ALL 
        SELECT task_id FROM task_handshakes WHERE freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Clients create otps" ON otps FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM tasks WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- =============================================================================
-- TRIGGER: Auto-create profile on new user signup
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, full_name, phone, city)
  VALUES (NEW.id, NEW.email, NULL, NULL, NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_profiles_modtime 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_tasks_modtime 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_chats_modtime 
  BEFORE UPDATE ON chats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_applications_modtime 
  BEFORE UPDATE ON task_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- FUNCTION: increment_completed_tasks
-- Increments the completed_tasks counter for a freelancer
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_completed_tasks(freelancer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET completed_tasks = completed_tasks + 1
  WHERE id = freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: update_freelancer_rating
-- Updates the average_rating for a freelancer after a new review
-- =============================================================================
CREATE OR REPLACE FUNCTION update_freelancer_rating(freelancer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE reviewee_id = freelancer_id
  )
  WHERE id = freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_fuzzy_location
-- Returns a fuzzy location (randomized offset) for privacy
-- =============================================================================
CREATE OR REPLACE FUNCTION get_fuzzy_location(
  actual_lat double precision,
  actual_lng double precision,
  offset_meters double precision DEFAULT 200
)
RETURNS TABLE (
  fuzzy_lat double precision,
  fuzzy_lng double precision,
  radius double precision
) AS $$
DECLARE
  random_angle double precision;
  random_distance double precision;
  lat_offset double precision;
  lng_offset double precision;
BEGIN
  -- Generate random angle and distance
  random_angle := random() * 2 * pi();
  random_distance := random() * offset_meters;
  
  -- Calculate offsets (approximate conversion)
  lat_offset := (random_distance * cos(random_angle)) / 111320.0;
  lng_offset := (random_distance * sin(random_angle)) / (111320.0 * cos(actual_lat * pi() / 180.0));
  
  RETURN QUERY SELECT 
    actual_lat + lat_offset,
    actual_lng + lng_offset,
    offset_meters;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
