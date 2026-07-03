-- Mint logs — track semua minting activity
CREATE TABLE IF NOT EXISTS mint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  token_id INTEGER,
  card_name TEXT,
  card_rarity TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mint_logs_wallet ON mint_logs (wallet_address);
CREATE INDEX IF NOT EXISTS idx_mint_logs_token ON mint_logs (token_id);

-- RLS: public read (transparency), insert via service role only (edge function)
ALTER TABLE mint_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mint_logs_select_public" ON mint_logs
  FOR SELECT USING (true);

-- No insert/update/delete policy — only service role (edge function) can write
