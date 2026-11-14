// ─── Job Preset ───────────────────────────────────────────────────────────────
export interface JobPreset {
  id: string;
  name: string;
  hourly_rate: number;
  night_allowance_pct: number;
  color: string;
  description?: string;
  created_at: string;
}

// ─── Work Session ─────────────────────────────────────────────────────────────
export interface WorkSession {
  id: string;
  preset_id: string;
  work_date: string;          // DATE  "YYYY-MM-DD"
  check_in: string;           // TIMESTAMPTZ
  check_out: string;          // TIMESTAMPTZ
  total_hours: number;
  day_hours: number;
  night_hours: number;
  calculated_amount: number;
  cycle_id?: string | null;
  status: 'pending' | 'approved';
  notes?: string | null;
  created_at: string;
  // join query
  preset?: JobPreset;
}

// ─── Salary Cycle ─────────────────────────────────────────────────────────────
export interface SalaryCycle {
  id: string;
  preset_id: string;
  cycle_number: number;
  start_date: string;         // DATE  "YYYY-MM-DD"
  total_calculated: number;
  total_received?: number | null;
  diff_amount?: number | null;
  diff_note?: string | null;
  status: 'open' | 'closed';
  closed_at?: string | null;
  created_at: string;
  // join query
  preset?: JobPreset;
}

// ─── Wish Item ────────────────────────────────────────────────────────────────
export interface WishItem {
  id: string;
  name: string;
  price_vnd: number;
  image_url?: string | null;
  tiktok_links: string[];
  priority: number;
  notes?: string | null;
  created_at: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  preset_id?: string | null;
  cycle_id?: string | null;
  created_at: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export interface Wallet {
  id: number;
  cash_balance: number;
  last_updated: string;
}
