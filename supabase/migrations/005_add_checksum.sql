-- Add data_checksum column ke players table
-- Buat integrity check — detect data tampering via Supabase dashboard/API

ALTER TABLE players ADD COLUMN IF NOT EXISTS data_checksum TEXT;
