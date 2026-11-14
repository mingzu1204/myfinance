-- Wallet (single row)
CREATE TABLE IF NOT EXISTS wallet (
  id INTEGER PRIMARY KEY DEFAULT 1,
  cash_balance BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO wallet (id, cash_balance) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Job presets
CREATE TABLE IF NOT EXISTS job_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  night_allowance_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#7c3aed',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work sessions
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID REFERENCES job_presets(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  total_hours NUMERIC(6,2) NOT NULL,
  day_hours NUMERIC(6,2) DEFAULT 0,
  night_hours NUMERIC(6,2) DEFAULT 0,
  calculated_amount BIGINT NOT NULL,
  cycle_id UUID,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary cycles
CREATE TABLE IF NOT EXISTS salary_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID REFERENCES job_presets(id) ON DELETE CASCADE,
  cycle_number INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  total_calculated BIGINT DEFAULT 0,
  total_received BIGINT,
  diff_amount BIGINT,
  diff_note TEXT,
  status TEXT DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wish items
CREATE TABLE IF NOT EXISTS wish_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_vnd BIGINT NOT NULL,
  image_url TEXT,
  tiktok_links TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  preset_id UUID REFERENCES job_presets(id),
  cycle_id UUID REFERENCES salary_cycles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
