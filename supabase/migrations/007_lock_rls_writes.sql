-- 007_lock_rls_writes.sql
-- Lock RLS: client tidak bisa langsung UPDATE players
-- Semua update harus melalui Edge Function (save-progress / mint-card)
-- yang pakai service role + signature verification

-- 1. Hapus policy UPDATE yang terlalu permisif
DROP POLICY IF EXISTS "players_update_own" ON players;
DROP POLICY IF EXISTS "players_update_auth" ON players;
DROP POLICY IF EXISTS "players_update_anon" ON players;

-- 2. Policy SELECT tetap public (leaderboard, profile view)
-- (sudah ada dari migration sebelumnya)

-- 3. Policy INSERT hanya untuk service role (create player via Edge Function)
DROP POLICY IF EXISTS "players_insert_anon" ON players;
DROP POLICY IF EXISTS "players_insert_auth" ON players;

CREATE POLICY "players_insert_service" ON players
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 4. Policy UPDATE hanya untuk service role (save-progress Edge Function)
CREATE POLICY "players_update_service" ON players
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Hapus helper function yang tidak dipakai lagi
DROP FUNCTION IF EXISTS app_set_config(text, text);

-- 6. Verify: cek policy yang aktif
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'players';
