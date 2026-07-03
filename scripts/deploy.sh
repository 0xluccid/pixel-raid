#!/bin/bash
# Pixel Raid — Push + Deploy Script
# Jalankan di lokal lo (bukan di VPS)

set -e

# ========== CONFIG ==========
REPO_DIR="."  # Ganti ke path pixel-raid lo
GH_TOKEN=<YOUR_GITHUB_PAT>
SUPABASE_URL="https://hchrdclodhasoxvjfxss.supabase.co"
SUPABASE_SERVICE_KEY=<YOUR_SERVICE_ROLE_KEY>

# ========== STEP 1: PULL + PUSH ==========
echo "📥 Pull latest changes..."
cd "$REPO_DIR"
git pull origin main

echo "🚀 Push ke GitHub..."
git push origin main

# ========== STEP 2: DEPLOY EDGE FUNCTIONS ==========
echo "🔧 Deploy Edge Functions..."

# Deploy mint-card
echo "  → mint-card"
curl -s -X POST "$SUPABASE_URL/functions/v1/deploy" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "mint-card", "verify_jwt": false}' || echo "  ⚠️ Deploy via dashboard manual"

# Deploy validate-battle
echo "  → validate-battle"
curl -s -X POST "$SUPABASE_URL/functions/v1/deploy" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "validate-battle", "verify_jwt": false}' || echo "  ⚠️ Deploy via dashboard manual"

# ========== STEP 3: RUN MIGRATIONS ==========
echo "🗃️ Run SQL migrations..."
echo "  Buka Supabase Dashboard → SQL Editor"
echo "  Copy-paste isi file: supabase/setup_rls.sql"
echo "  Lalu jalankan"

echo ""
echo "✅ DONE! Checklist:"
echo "  [ ] Supabase → SQL Editor → run setup_rls.sql"
echo "  [ ] Supabase → Edge Functions → deploy mint-card + validate-battle"
echo "  [ ] Supabase → Edge Functions → set secret RELAYER_PRIVATE_KEY"
echo "  [ ] Test: npm test"
