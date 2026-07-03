-- ============================================
-- PIXEL RAID — Fix RLS: wallet-based auth
-- Problem: 002 migration opened RLS too wide (anon can update ANY row)
-- Fix: restrict to wallet_address match
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "players_insert_anon" ON players;
DROP POLICY IF EXISTS "players_update_anon" ON players;

-- Insert: allow anon, tapi wallet_address harus unik (sudah ada UNIQUE constraint)
-- Insert tetap open karena new player butuh create row
CREATE POLICY "players_insert_anon" ON players
  FOR INSERT WITH CHECK (true);

-- Update: RESTRICT — hanya bisa update row yg wallet_address-nya match
-- Client harus set wallet_address di header/variable sebelum update
-- Menggunakan current_setting untuk pass wallet dari client
CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (
    wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'wallet')
  );

-- Fallback: jika ga pakai JWT claims, bisa pakai app setting
-- Client jalankan: SELECT set_config('app.wallet', '0x...', true);
-- Lalu policy pakai: wallet_address = lower(current_setting('app.wallet', true))
-- 
-- Untuk sementara, pakai approach app.wallet karena lebih simpel
-- (Supabase anon key ga punya JWT claims custom)

DROP POLICY IF EXISTS "players_update_own" ON players;

CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (
    wallet_address = lower(current_setting('app.wallet', true))
  );

-- Delete: tetap disabled (no deletes from client)

-- Helper function: set session config (untuk RLS wallet context)
CREATE OR REPLACE FUNCTION app_set_config(key text, value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(key, value, false); -- false = session-level, not transaction
END;
$$ LANGUAGE plpgsql;
