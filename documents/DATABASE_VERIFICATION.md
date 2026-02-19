# TalentFlow Database Verification Guide

**Document Purpose:** This guide provides SQL queries and expected results for verifying the TalentFlow database setup in Supabase. Share this document with your database engineer for cross-checking all configurations.

**Last Updated:** February 2026

---

## Table of Contents

1. [Extensions](#1-extensions)
2. [Tables](#2-tables)
3. [Columns & Data Types](#3-columns--data-types)
4. [Indexes](#4-indexes)
5. [Custom Functions](#5-custom-functions)
6. [Triggers](#6-triggers)
7. [Row Level Security (RLS)](#7-row-level-security-rls)
8. [Realtime Publication](#8-realtime-publication)
9. [Enums](#9-enums)
10. [Quick Health Check](#10-quick-health-check)
11. [Missing Components Recovery](#11-missing-components-recovery)

---

## 1. Extensions

### Query
```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('postgis', 'uuid-ossp')
ORDER BY extname;
```

### Expected Result
| extname | extversion |
|---------|------------|
| postgis | 3.x.x |
| uuid-ossp | 1.x |

### Notes
- **PostGIS** is required for geospatial queries (5km radius task matching)
- **uuid-ossp** is required for UUID generation in primary keys

---

## 2. Tables

### Query
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Expected Result (10 tables)
| table_name |
|------------|
| chats |
| messages |
| otps |
| profiles |
| reviews |
| sos_alerts |
| task_applications |
| task_attachments |
| task_handshakes |
| tasks |

### Notes
All 10 tables must exist. If any are missing, refer to the schema.sql file.

---

## 3. Columns & Data Types

### 3.1 Profiles Table

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### Expected Columns
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| user_id | uuid | NO |
| email | text | NO |
| role | text | YES |
| full_name | text | YES |
| phone | text | YES |
| city | text | YES |
| verification_status | USER-DEFINED | NO |
| college_id_url | text | YES |
| gov_id_url | text | YES |
| college_name | text | YES |
| skills | jsonb | YES |
| commission_rate | integer | NO |
| location | USER-DEFINED | YES |
| last_location_update | timestamp with time zone | YES |
| gear_list | jsonb | YES |
| completed_tasks | integer | YES |
| average_rating | decimal | YES |
| created_at | timestamp with time zone | YES |
| updated_at | timestamp with time zone | YES |

### 3.2 Tasks Table

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

### Expected Columns
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| client_id | uuid | NO |
| title | text | NO |
| description | text | NO |
| mode | USER-DEFINED | NO |
| category | USER-DEFINED | NO |
| budget | decimal | NO |
| escrow_amount | decimal | YES |
| geo_location | USER-DEFINED | YES |
| address_text | text | YES |
| is_nearby | boolean | NO |
| status | USER-DEFINED | NO |
| acceptance_deadline | timestamp with time zone | YES |
| portfolio_required | boolean | YES |
| revision_limit | integer | YES |
| created_at | timestamp with time zone | YES |
| updated_at | timestamp with time zone | YES |
| started_at | timestamp with time zone | YES |
| completed_at | timestamp with time zone | YES |

### 3.3 Task Handshakes Table

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'task_handshakes'
ORDER BY ordinal_position;
```

### Expected Columns
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| task_id | uuid | NO |
| freelancer_id | uuid | NO |
| accepted_at | timestamp with time zone | YES |
| is_cancelled | boolean | YES |
| cancelled_reason | text | YES |

### 3.4 OTPs Table

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'otps'
ORDER BY ordinal_position;
```

### Expected Columns
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| task_id | uuid | NO |
| otp | text | NO |
| otp_type | text | NO |
| is_used | boolean | YES |
| created_at | timestamp with time zone | YES |
| expires_at | timestamp with time zone | YES |

---

## 4. Indexes

### Query
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Expected Indexes
| tablename | indexname | purpose |
|-----------|-----------|---------|
| profiles | idx_profiles_location | GIST index for geospatial queries |
| profiles | idx_profiles_user | B-tree for user_id lookups |
| profiles | idx_profiles_role | B-tree for role filtering |
| tasks | idx_tasks_status | B-tree for status filtering |
| tasks | idx_tasks_client | B-tree for client's tasks |
| tasks | idx_tasks_geo | GIST index for geospatial queries |
| task_handshakes | idx_task_handshakes_task | B-tree for task lookups |
| task_applications | idx_task_applications_task | B-tree for task lookups |
| chats | idx_chats_task | B-tree for task lookups |
| messages | idx_messages_chat | B-tree for chat lookups |
| reviews | idx_reviews_task | B-tree for task lookups |

### Critical Geospatial Indexes Check
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexdef LIKE '%GIST%';
```

### Expected Result
| indexname | indexdef |
|-----------|----------|
| idx_profiles_location | CREATE INDEX idx_profiles_location ON public.profiles USING gist (location) |
| idx_tasks_geo | CREATE INDEX idx_tasks_geo ON public.tasks USING gist (geo_location) |

---

## 5. Custom Functions

### Query
```sql
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'find_nearby_tasks',
    'get_fuzzy_location',
    'handle_new_user',
    'increment_completed_tasks',
    'update_freelancer_rating',
    'update_updated_at'
  )
ORDER BY routine_name;
```

### Expected Result (6 functions)
| routine_name | purpose |
|--------------|---------|
| find_nearby_tasks | Returns tasks within 5km radius using PostGIS |
| get_fuzzy_location | Returns randomized location for privacy (200m offset) |
| handle_new_user | Auto-creates profile on user signup |
| increment_completed_tasks | Increments freelancer's completed task count |
| update_freelancer_rating | Updates average rating after review |
| update_updated_at | Trigger function for updated_at timestamps |

### Function Details

#### 5.1 find_nearby_tasks
```sql
-- Test the function signature
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'find_nearby_tasks';
```

**Expected Parameters:**
- `user_lat` (double precision)
- `user_lng` (double precision)
- `radius_meters` (double precision, default 5000)

**Expected Returns:** TABLE with columns: id, title, budget, category, mode, distance_meters

#### 5.2 get_fuzzy_location
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'get_fuzzy_location';
```

**Expected Parameters:**
- `actual_lat` (double precision)
- `actual_lng` (double precision)
- `offset_meters` (double precision, default 200)

**Expected Returns:** TABLE with columns: fuzzy_lat, fuzzy_lng, radius

---

## 6. Triggers

### Query
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Expected Triggers
| trigger_name | table | event | purpose |
|--------------|-------|-------|---------|
| on_auth_user_created | auth.users | INSERT | Auto-create profile on signup |
| update_profiles_modtime | profiles | UPDATE | Update updated_at timestamp |
| update_tasks_modtime | tasks | UPDATE | Update updated_at timestamp |
| update_chats_modtime | chats | UPDATE | Update updated_at timestamp |
| update_applications_modtime | task_applications | UPDATE | Update updated_at timestamp |

### Verify Auth Trigger
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

---

## 7. Row Level Security (RLS)

### 7.1 Check RLS is Enabled

```sql
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname IN (
  'profiles', 'tasks', 'task_handshakes', 'task_applications',
  'chats', 'messages', 'task_attachments', 'reviews', 'sos_alerts', 'otps'
)
AND relkind = 'r'
ORDER BY relname;
```

### Expected Result
| table_name | rls_enabled | rls_forced |
|------------|-------------|------------|
| chats | true | false |
| messages | true | false |
| otps | true | false |
| profiles | true | false |
| reviews | true | false |
| sos_alerts | true | false |
| task_applications | true | false |
| task_attachments | true | false |
| task_handshakes | true | false |
| tasks | true | false |

### 7.2 Check RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Expected Policies

#### profiles table
| policyname | cmd | description |
|------------|-----|-------------|
| Public profiles viewable | SELECT | Anyone can view profiles |
| Users update own profile | UPDATE | Users can only update their own profile |
| Users insert own profile | INSERT | Users can only insert their own profile |

#### tasks table
| policyname | cmd | description |
|------------|-----|-------------|
| Users create tasks | INSERT | Authenticated users can create tasks |
| Clients manage own tasks | ALL | Clients can manage their own tasks |
| Open tasks viewable | SELECT | Anyone can view open tasks |

#### task_handshakes table
| policyname | cmd | description |
|------------|-----|-------------|
| Freelancers create handshakes | INSERT | Freelancers can accept tasks |
| Participants view handshakes | SELECT | Only participants can view handshakes |

#### otps table
| policyname | cmd | description |
|------------|-----|-------------|
| Participants view otps | SELECT | Only task participants can view OTPs |
| Clients create otps | INSERT | Only task clients can create OTPs |

---

## 8. Realtime Publication

### Query
```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

### Expected Result
| schemaname | tablename |
|------------|-----------|
| public | tasks |
| public | task_handshakes |

### Add Missing Tables to Realtime (if needed)
```sql
-- Add tasks table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Add task_handshakes table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_handshakes;
```

---

## 9. Enums

### Query
```sql
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('task_mode', 'task_category', 'task_status', 'verification_status')
ORDER BY t.typname, e.enumsortorder;
```

### Expected Enums

#### task_mode
| enum_value |
|------------|
| immediate |
| standard |

#### task_category
| enum_value |
|------------|
| content_engine |
| hyper_local_logistics |
| tech_neighbor |
| academic_support |
| event_support |
| ai_training |
| digital_assistant |

#### task_status
| enum_value |
|------------|
| open |
| assigned |
| in_progress |
| review |
| completed |
| disputed |
| cancelled |

#### verification_status
| enum_value |
|------------|
| none |
| pending |
| verified |

---

## 10. Quick Health Check

Run this single query for an overall health check:

```sql
WITH table_check AS (
  SELECT COUNT(*) as count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
),
extension_check AS (
  SELECT COUNT(*) as count
  FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp')
),
function_check AS (
  SELECT COUNT(*) as count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
      'find_nearby_tasks', 'get_fuzzy_location', 'handle_new_user',
      'increment_completed_tasks', 'update_freelancer_rating', 'update_updated_at'
    )
),
rls_check AS (
  SELECT COUNT(*) as count
  FROM pg_class
  WHERE relname IN ('profiles', 'tasks', 'task_handshakes', 'task_applications',
                    'chats', 'messages', 'task_attachments', 'reviews', 'sos_alerts', 'otps')
    AND relrowsecurity = true
),
realtime_check AS (
  SELECT COUNT(*) as count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
),
index_check AS (
  SELECT COUNT(*) as count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN ('idx_profiles_location', 'idx_tasks_geo')
)
SELECT 
  tc.count as "Tables (expected: 10)",
  ec.count as "Extensions (expected: 2)",
  fc.count as "Functions (expected: 6)",
  rc.count as "RLS Tables (expected: 10)",
  rtc.count as "Realtime Tables (expected: 2)",
  ic.count as "Geo Indexes (expected: 2)"
FROM table_check tc, extension_check ec, function_check fc, rls_check rc, realtime_check rtc, index_check ic;
```

### Expected Result
| Tables | Extensions | Functions | RLS Tables | Realtime Tables | Geo Indexes |
|--------|------------|-----------|------------|-----------------|-------------|
| 10 | 2 | 6 | 10 | 2 | 2 |

---

## 11. Missing Components Recovery

If any components are missing, run the appropriate SQL below.

### 11.1 Missing Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 11.2 Missing Functions

#### find_nearby_tasks
```sql
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
```

#### get_fuzzy_location
```sql
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
  random_angle := random() * 2 * pi();
  random_distance := random() * offset_meters;
  
  lat_offset := (random_distance * cos(random_angle)) / 111320.0;
  lng_offset := (random_distance * sin(random_angle)) / (111320.0 * cos(actual_lat * pi() / 180.0));
  
  RETURN QUERY SELECT 
    actual_lat + lat_offset,
    actual_lng + lng_offset,
    offset_meters;
END;
$$ LANGUAGE plpgsql;
```

#### increment_completed_tasks
```sql
CREATE OR REPLACE FUNCTION increment_completed_tasks(freelancer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET completed_tasks = completed_tasks + 1
  WHERE id = freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### update_freelancer_rating
```sql
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
```

#### update_updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### handle_new_user
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, full_name, phone, city)
  VALUES (NEW.id, NEW.email, NULL, NULL, NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 11.3 Missing Triggers
```sql
-- Auth trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at triggers
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
```

### 11.4 Missing Geospatial Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_tasks_geo ON tasks USING GIST(geo_location);
```

### 11.5 Enable RLS on Tables
```sql
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
```

---

## 12. Test Queries

### 12.1 Test PostGIS
```sql
-- Should return a point geometry
SELECT ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326);
```

### 12.2 Test find_nearby_tasks Function
```sql
-- Create a test task first
INSERT INTO tasks (id, client_id, title, description, mode, category, budget, geo_location, is_nearby, status)
SELECT 
  uuid_generate_v4(),
  (SELECT id FROM profiles LIMIT 1),
  'Test Task',
  'Test Description',
  'immediate',
  'tech_neighbor',
  500.00,
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography,
  true,
  'open'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Test the function
SELECT * FROM find_nearby_tasks(28.6139, 77.2090, 5000);
```

### 12.3 Test get_fuzzy_location Function
```sql
SELECT * FROM get_fuzzy_location(28.6139, 77.2090, 200);
```

---

## Contact

For questions about this schema, refer to:
- Schema file: `supabase/schema.sql`
- Architecture doc: `plans/TALENTFLOW_ARCHITECTURE.md`
