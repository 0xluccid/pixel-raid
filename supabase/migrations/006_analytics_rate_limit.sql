-- 006: Analytics + Rate Limiting

-- 1. Analytics table — track semua event
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'battle_end', 'mint', 'page_view', 'wallet_connect'
  wallet_address TEXT,
  data JSONB DEFAULT '{}', -- fleksibel: battle result, hero class, dll
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_wallet ON analytics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at DESC);

-- RLS: public read, service role only insert
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_select_public" ON analytics
  FOR SELECT USING (true);

CREATE POLICY "analytics_insert_service" ON analytics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 2. Function: get_top_heroes — hero paling populer
CREATE OR REPLACE FUNCTION get_top_heroes(limit_count INT DEFAULT 10)
RETURNS TABLE(hero_class TEXT, pick_count BIGINT) AS $$
  SELECT 
    data->>'heroClass' AS hero_class,
    COUNT(*) AS pick_count
  FROM analytics
  WHERE event_type = 'battle_end'
    AND data->>'heroClass' IS NOT NULL
  GROUP BY data->>'heroClass'
  ORDER BY pick_count DESC
  LIMIT limit_count;
$$ LANGUAGE sql;

-- 3. Function: get_economy_stats — total gold beredar, avg per player
CREATE OR REPLACE FUNCTION get_economy_stats()
RETURNS TABLE(
  total_players BIGINT,
  total_gold BIGINT,
  avg_gold NUMERIC,
  total_gems BIGINT,
  avg_level NUMERIC
) AS $$
  SELECT 
    COUNT(*) AS total_players,
    SUM(gold) AS total_gold,
    ROUND(AVG(gold), 0) AS avg_gold,
    SUM(gem) AS total_gems,
    ROUND(AVG(level), 1) AS avg_level
  FROM players;
$$ LANGUAGE sql;

-- 4. Rate limit tracking view
CREATE OR REPLACE VIEW rate_limit_status AS
SELECT 
  wallet_address,
  event_type,
  COUNT(*) AS events_last_hour,
  MAX(created_at) AS last_event
FROM analytics
WHERE created_at > now() - INTERVAL '1 hour'
GROUP BY wallet_address, event_type;
