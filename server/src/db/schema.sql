-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  google_access_token TEXT,
  google_refresh_token TEXT,
  microsoft_access_token TEXT,
  microsoft_refresh_token TEXT,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category VARCHAR(100),
  alarm_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timetable slots (recurring schedule blocks)
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat, NULL=daily
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'google', 'microsoft')),
  external_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits - things you MUST do
CREATE TABLE IF NOT EXISTS must_do_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50) DEFAULT 'daily',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits - things you MUST NOT do
CREATE TABLE IF NOT EXISTS must_not_do_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  motivation_video_url VARCHAR(1000),
  motivation_video_title VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration permissions
CREATE TABLE IF NOT EXISTS integration_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'microsoft', 'whatsapp')),
  enabled BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_scheduled_at ON todos(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON timetable_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_must_do_user_id ON must_do_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_must_not_do_user_id ON must_not_do_habits(user_id);
