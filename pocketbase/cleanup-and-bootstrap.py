#!/usr/bin/env python3
"""Bootstrap PocketBase collections for Pixel Raid with correct v0.22 schema format."""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8090"
EMAIL = "admin@pixel.brebross.xyz"
PASS = "PixelRaidAdmin2026!"

def req(method, path, token=None, body=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    data = None
    if body is not None:
        data = json.dumps(body).encode()
    r = urllib.request.Request(url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(r) as resp:
            ct = resp.headers.get("Content-Type", "")
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if "json" in ct else raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw

# 1. Login
status, body = req("POST", "/api/admins/auth-with-password", body={
    "identity": EMAIL, "password": PASS
})
if status != 200:
    print(f"Login failed: {body}")
    sys.exit(1)
TOKEN = body["token"]
print(f"Logged in. Token len={len(TOKEN)}")
AUTH = {"Authorization": TOKEN, "Content-Type": "application/json"}

# 2. Cleanup test collections
status, body = req("GET", "/api/collections?perPage=100", token=TOKEN)
if status == 200:
    for c in body.get("items", []):
        if c["name"].startswith("test_"):
            print(f"Deleting test collection: {c['name']}")
            req("DELETE", f"/api/collections/{c['id']}", token=TOKEN)

# 3. Helper — define schema field
def text(name, **opts): return {"name": name, "type": "text", "options": opts}
def number(name, **opts): return {"name": name, "type": "number", "options": opts}
def bool(name, **opts): return {"name": name, "type": "bool", "options": opts}
def date(name, **opts): return {"name": name, "type": "date", "options": opts}
def json_field(name, **opts): return {"name": name, "type": "json", "options": opts}
def select(name, values, **opts):
    o = {"maxSelect": 1, "values": values}
    o.update(opts)
    return {"name": name, "type": "select", "options": o}
def rel(name, collection, **opts):
    o = {"collectionId": collection, "cascadeDelete": True, "minSelect": 1, "maxSelect": 1}
    o.update(opts)
    return {"name": name, "type": "relation", "options": o}

# 4. Collect collection definitions
collections = [
    {
        "name": "players",
        "type": "base",
        "system": False,
        "listRule": "",
        "viewRule": "",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "@request.auth.id = user",
        "deleteRule": "@request.auth.id = user",
        "schema": [
            rel("user", "_pb_users_auth_", unique=True),
            text("wallet_address"),
            text("display_name", min=3, max=16, pattern="^[a-zA-Z0-9_-]+$"),
            number("level", min=1, max=999),
            number("exp", min=0),
            number("gold", min=0),
            number("gem", min=0),
            number("current_stage", min=1),
            number("highest_stage", min=1),
            number("total_battles", min=0),
            number("total_wins", min=0),
            number("win_streak", min=0),
            number("playtime_seconds", min=0),
            date("last_seen"),
        ],
        "indexes": [
            "CREATE INDEX idx_players_highest_stage ON players (highest_stage DESC)",
            "CREATE INDEX idx_players_total_wins ON players (total_wins DESC)",
        ],
    },
    {
        "name": "heroes",
        "type": "base",
        "system": False,
        "listRule": "",
        "viewRule": "",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "owner.user = @request.auth.id",
        "deleteRule": "owner.user = @request.auth.id",
        "schema": [
            rel("owner", "players"),
            text("name"),
            text("class"),
            select("rarity", ["common", "uncommon", "rare", "epic", "legendary", "mythic"]),
            number("level", min=1, max=100),
            number("exp", min=0),
            number("hp", min=1),
            number("atk", min=1),
            number("def", min=0),
            number("spd", min=1),
            number("crit", min=0, max=100),
            text("skill_name"),
            select("skill_type", ["physical", "magical", "heal", "buff", "debuff", "aoe"]),
            number("skill_value", min=0),
            number("art_seed", min=0),
            text("on_chain_token_id"),
            bool("minted"),
            date("created_at"),
        ],
        "indexes": [],
    },
    {
        "name": "battles",
        "type": "base",
        "system": False,
        "listRule": "",
        "viewRule": "",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "id = \"\"",   # immutable
        "deleteRule": "id = \"\"",   # immutable
        "schema": [
            rel("player", "players"),
            number("stage", min=1),
            number("wave", min=1, max=3),
            bool("won"),
            json_field("hero_ids"),
            number("gold_earned", min=0),
            number("exp_earned", min=0),
            number("duration_ms", min=0),
            json_field("battle_log"),
            date("created_at"),
        ],
        "indexes": [],
    },
    {
        "name": "marketplace_listings",
        "type": "base",
        "system": False,
        "listRule": "",
        "viewRule": "",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "seller.user = @request.auth.id || @request.auth.role = \"admin\"",
        "deleteRule": "seller.user = @request.auth.id || @request.auth.role = \"admin\"",
        "schema": [
            rel("seller", "players", cascadeDelete=True),
            rel("hero", "heroes", cascadeDelete=False),
            text("on_chain_listing_id"),
            text("price_wei"),
            select("currency", ["BNB", "PRC"]),
            select("status", ["active", "sold", "cancelled"]),
            date("listed_at"),
            date("sold_at"),
        ],
        "indexes": [],
    },
    {
        "name": "achievements",
        "type": "base",
        "system": False,
        "listRule": "",
        "viewRule": "",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "player.user = @request.auth.id",
        "deleteRule": "player.user = @request.auth.id",
        "schema": [
            rel("player", "players"),
            text("achievement_id"),
            text("title"),
            text("description"),
            number("progress", min=0, max=100),
            bool("unlocked"),
            date("unlocked_at"),
        ],
        "indexes": [],
    },
]

# 5. Get existing collections
status, body = req("GET", "/api/collections?perPage=100", token=TOKEN)
existing = {c["name"]: c["id"] for c in body.get("items", [])} if status == 200 else {}

# 6. Create missing
for col in collections:
    name = col["name"]
    if name in existing:
        print(f"  => {name} exists, skipping")
        continue
    status, body = req("POST", "/api/collections", token=TOKEN, body=col)
    if status in (200, 201):
        new_id = body.get("id", "?")
        print(f"  => {name} created (id={new_id})")
    else:
        print(f"  X {name} FAILED: {json.dumps(body)[:300]}")

# 7. Final state
print("\n=== Final collection state ===")
status, body = req("GET", "/api/collections?perPage=100", token=TOKEN)
for c in body.get("items", []):
    if c.get("system"):
        continue
    print(f"  {c['name']:<28} id={c['id']:<28} type={c['type']} schema_fields={len(c.get('schema', []))}")
