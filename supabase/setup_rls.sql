-- PIXEL RAID: Fix RLS + Setup Functions
-- Copy-paste ini ke Supabase Dashboard → SQL Editor → Run

-- 1. Drop overly permissive policies
DROP POLICY IF EXISTS "players_insert_anon" ON players;
DROP POLICY IF EXISTS "players_update_anon" ON players;

-- 2. Insert: tetap open (new player butuh create row)
CREATE POLICY "players_insert_anon" ON players
  FOR INSERT WITH CHECK (true);

-- 3. Update: RESTRICT — hanya bisa update row yg wallet_address-nya match
DROP POLICY IF EXISTS "players_update_own" ON players;

CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (
    wallet_address = lower(current_setting('app.wallet', true))
  );

-- 4. Helper function: set session config (untuk RLS wallet context)
CREATE OR REPLACE FUNCTION app_set_config(key text, value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(key, value, false); -- false = session-level
END;
$$ LANGUAGE plpgsql;

-- 5. Table buat log minting (server-side only)
CREATE TABLE IF NOT EXISTS mint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  hero_class TEXT NOT NULL,
  rarity TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index buat quick lookup
CREATE INDEX IF NOT EXISTS idx_mint_logs_wallet ON mint_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mint_logs_tx ON mint_logs(tx_hash);

-- 6. RLS untuk mint_logs (hanya service role yg bisa insert)
ALTER TABLE mint_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mint_logs_insert_service" ON mint_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "mint_logs_select_public" ON mint_logs
  FOR SELECT USING (true);

-- DONE! Sekarang deploy Edge Functions via CLI:
-- supabase functions deploy mint-card
-- supabase functions deploy validate-battle
