#!/bin/bash
# Pixel Raid — Bootstrap collections for PocketBase.
# Idempotent: skips collections that already exist.
# Requires: PB server running + admin already created at admin@pixel.brebross.xyz / PixelRaidAdmin2026!

set -e
API="http://127.0.0.1:8090"
PB_DIR="/root/pixel-raid/pocketbase"
cd "$PB_DIR"

# 1. Get admin token
echo "==> Getting admin token..."
TOKEN=$(python3 - <<'PY'
import urllib.request, json
r = urllib.request.urlopen(urllib.request.Request(
    "http://127.0.0.1:8090/api/admins/auth-with-password",
    data=json.dumps({"identity":"admin@pixel.brebross.xyz","password":"PixelRaidAdmin2026!"}).encode(),
    headers={"Content-Type":"application/json"}))
print(json.load(r).get("token",""))
PY
)
[ -z "$TOKEN" ] && { echo "ERROR: empty token"; exit 1; }
echo "   Token len: ${#TOKEN}"
AUTH_HDR=*** ${TOKEN}"

# 2. Helper
exists() {
  local name="$1"
  curl -s -H "$AUTH_HDR" "$API/api/collections/$name" | grep -q "\"name\":\"$name\""
}

create_collection() {
  local name="$1"
  local schema="$2"
  if exists "$name"; then
    echo "   [$name] already exists, skipping"
    return 0
  fi
  echo "   [$name] creating..."
  local payload=$(python3 -c "
import json, sys
schema = json.loads('''$schema'''.replace('\\\"','\"'))
collection = {'name': '$name', 'type': 'base', 'system': False,
              'listRule': '', 'viewRule': '',
              'createRule': '@request.auth.id != \"\"',
              'updateRule': '@request.auth.id != \"\"',
              'deleteRule': '@request.auth.id != \"\"'}
# Per-collection overrides
collection.update(schema)
print(json.dumps(collection))
")
  local resp=$(python3 - <<PY
import urllib.request, json
data = '''$payload'''.strip()
req = urllib.request.Request("$API/api/collections",
    data=data.encode(),
    headers={"Content-Type":"application/json","Authorization":"$TOKEN"},
    method="POST")
try:
    r = urllib.request.urlopen(req)
    out = json.load(r)
    print("OK", out.get("id"))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print("ERR", body[:300])
PY
)
  echo "     $resp"
  # Brief sleep so PB internal cache catches up before next collection
  sleep 1
}

# 3. Create collections in dependency order
echo "==> Creating collections..."

create_collection "players" '{
  "schema": [
    {"name":"user","type":"relation","options":{"collectionId":"_pb_users_auth_","cascadeDelete":true,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"wallet_address","type":"text","required":false,"options":{"indexed":true}},
    {"name":"display_name","type":"text","required":true,"options":{"min":3,"max":16,"pattern":"^[a-zA-Z0-9_-]+$"}},
    {"name":"level","type":"number","required":true,"options":{"min":1,"max":999}},
    {"name":"exp","type":"number","required":true,"options":{"min":0}},
    {"name":"gold","type":"number","required":true,"options":{"min":0}},
    {"name":"gem","type":"number","required":true,"options":{"min":0}},
    {"name":"current_stage","type":"number","required":true,"options":{"min":1}},
    {"name":"highest_stage","type":"number","required":true,"options":{"min":1}},
    {"name":"total_battles","type":"number","required":true,"options":{"min":0}},
    {"name":"total_wins","type":"number","required":true,"options":{"min":0}},
    {"name":"win_streak","type":"number","required":true,"options":{"min":0}},
    {"name":"playtime_seconds","type":"number","required":true,"options":{"min":0}},
    {"name":"last_seen","type":"date","required":true}
  ],
  "indexes": [
    "CREATE INDEX idx_players_wallet ON players (wallet_address)",
    "CREATE INDEX idx_players_highest_stage ON players (highest_stage DESC)",
    "CREATE INDEX idx_players_total_wins ON players (total_wins DESC)"
  ]
}'

create_collection "heroes" '{
  "createRule": "@request.auth.id != \"\"",
  "schema": [
    {"name":"owner","type":"relation","options":{"collectionId":"players","cascadeDelete":true,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"name","type":"text","required":true},
    {"name":"class","type":"text","required":true},
    {"name":"rarity","type":"select","required":true,"options":{"maxSelect":1,"values":["common","uncommon","rare","epic","legendary","mythic"]}},
    {"name":"level","type":"number","required":true,"options":{"min":1,"max":100}},
    {"name":"exp","type":"number","required":true,"options":{"min":0}},
    {"name":"hp","type":"number","required":true,"options":{"min":1}},
    {"name":"atk","type":"number","required":true,"options":{"min":1}},
    {"name":"def","type":"number","required":true,"options":{"min":0}},
    {"name":"spd","type":"number","required":true,"options":{"min":1}},
    {"name":"crit","type":"number","required":true,"options":{"min":0,"max":100}},
    {"name":"skill_name","type":"text","required":true},
    {"name":"skill_type","type":"select","required":true,"options":{"maxSelect":1,"values":["physical","magical","heal","buff","debuff","aoe"]}},
    {"name":"skill_value","type":"number","required":true,"options":{"min":0}},
    {"name":"art_seed","type":"number","required":true},
    {"name":"on_chain_token_id","type":"text","required":false,"options":{"indexed":true}},
    {"name":"minted","type":"bool","required":true},
    {"name":"created_at","type":"date","required":true}
  ],
  "indexes": [
    "CREATE INDEX idx_heroes_owner ON heroes (owner)"
  ]
}'

create_collection "battles" '{
  "createRule": "@request.auth.id != \"\"",
  "updateRule": null,
  "deleteRule": null,
  "schema": [
    {"name":"player","type":"relation","options":{"collectionId":"players","cascadeDelete":true,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"stage","type":"number","required":true,"options":{"min":1}},
    {"name":"wave","type":"number","required":true,"options":{"min":1,"max":3}},
    {"name":"won","type":"bool","required":true},
    {"name":"hero_ids","type":"json","required":true},
    {"name":"gold_earned","type":"number","required":true,"options":{"min":0}},
    {"name":"exp_earned","type":"number","required":true,"options":{"min":0}},
    {"name":"duration_ms","type":"number","required":true,"options":{"min":0}},
    {"name":"battle_log","type":"json","required":false},
    {"name":"created_at","type":"date","required":true}
  ],
  "indexes": [
    "CREATE INDEX idx_battles_player ON battles (player)",
    "CREATE INDEX idx_battles_created ON battles (created_at DESC)"
  ]
}'

create_collection "marketplace_listings" '{
  "updateRule": "@request.auth.role = \"admin\" || @request.auth.id != \"\"",
  "deleteRule": "@request.auth.role = \"admin\" || @request.auth.id != \"\"",
  "schema": [
    {"name":"seller","type":"relation","options":{"collectionId":"players","cascadeDelete":true,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"hero","type":"relation","options":{"collectionId":"heroes","cascadeDelete":false,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"on_chain_listing_id","type":"text","required":false,"options":{"indexed":true}},
    {"name":"price_wei","type":"text","required":true},
    {"name":"currency","type":"select","required":true,"options":{"maxSelect":1,"values":["BNB","PRC"]}},
    {"name":"status","type":"select","required":true,"options":{"maxSelect":1,"values":["active","sold","cancelled"]}},
    {"name":"listed_at","type":"date","required":true},
    {"name":"sold_at","type":"date","required":false}
  ]
}'

create_collection "achievements" '{
  "schema": [
    {"name":"player","type":"relation","options":{"collectionId":"players","cascadeDelete":true,"maxSelect":1,"minSelect":1,"required":true}},
    {"name":"achievement_id","type":"text","required":true},
    {"name":"title","type":"text","required":true},
    {"name":"description","type":"text","required":false},
    {"name":"progress","type":"number","required":true,"options":{"min":0,"max":100}},
    {"name":"unlocked","type":"bool","required":true},
    {"name":"unlocked_at","type":"date","required":false}
  ]
}'

echo ""
echo "==> Snapshotting collections to migration file..."
yes y | ./pocketbase migrate collections --dir="$PB_DIR/pb_data" --migrationsDir="$PB_DIR/pb_migrations" 2>&1 | tail -8
echo ""
echo "==> Migrations dir:"
ls -la "$PB_DIR/pb_migrations/"
echo ""
echo "==> Final state:"
curl -s -H "$AUTH_HDR" "$API/api/collections?fields=name,type" | python3 -m json.tool
