-- 006: Analytics + rate limiting tables

CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  wallet_address TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_wallet ON analytics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analytics_time ON analytics(created_at DESC);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_insert_service" ON analytics FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "analytics_select_service" ON analytics FOR SELECT USING (auth.role() = 'service_role');
