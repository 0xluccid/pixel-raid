#!/usr/bin/env python3
"""Bootstrap all 5 collections for Pixel Raid via PocketBase REST API.
Idempotent — skips collections that already exist.
"""
import json
import subprocess
import sys
import time
import urllib.request, urllib.error

API = "http://127.0.0.1:8090"
PB_DIR = "/root/pixel-raid/pocketbase"

def login():
    body = json.dumps({"identity":"admin@pixel.brebross.xyz","password":"PixelRaidAdmin2026!"}).encode()
    req = urllib.request.Request(f"{API}/api/admins/auth-with-password",
                                  data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req) as r:
        return json.load(r)["token"]

def get_json(path, token):
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": token})
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def post_json(path, token, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(f"{API}{path}", data=body, method="POST",
                                  headers={"Authorization": token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body.decode("utf-8","replace")[:300]}

def exists(name, token):
    try:
        c = get_json(f"/api/collections/{name}", token)
        return c.get("name") == name
    except urllib.error.HTTPError as e:
        return False

# ====== SCHEMA ======
RULES_AUTH = {
    "listRule": "",
    "viewRule": "",
    "createRule": '@request.auth.id != ""',
    "updateRule": '@request.auth.id != ""',
    "deleteRule": '@request.auth.id != ""',
}

RULES_ADMIN_OR_AUTH = {
    **RULES_AUTH,
    "updateRule": '@request.auth.role = "admin" || @request.auth.id != ""',
    "deleteRule": '@request.auth.role = "admin" || @request.auth.id != ""',
}

RULES_IMMUTABLE = {
    "listRule": "",
    "viewRule": "",
    "createRule": '@request.auth.id != ""',
    "updateRule": None,
    "deleteRule": None,
}

USERS_AUTH_ID = "_pb_users_auth_"

def players_schema():
    return {
        **RULES_AUTH,
        "name": "players",
        "type": "base",
        "system": False,
        "schema": [
            {"name":"user","type":"relation","options":{"collectionId":USERS_AUTH_ID,"cascadeDelete":True,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"wallet_address","type":"text","required":False,"options":{"indexed":True}},
            {"name":"display_name","type":"text","required":True,"options":{"min":3,"max":16,"pattern":"^[a-zA-Z0-9_-]+$"}},
            {"name":"level","type":"number","required":True,"options":{"min":1,"max":999}},
            {"name":"exp","type":"number","required":True,"options":{"min":0}},
            {"name":"gold","type":"number","required":True,"options":{"min":0}},
            {"name":"gem","type":"number","required":True,"options":{"min":0}},
            {"name":"current_stage","type":"number","required":True,"options":{"min":1}},
            {"name":"highest_stage","type":"number","required":True,"options":{"min":1}},
            {"name":"total_battles","type":"number","required":True,"options":{"min":0}},
            {"name":"total_wins","type":"number","required":True,"options":{"min":0}},
            {"name":"win_streak","type":"number","required":True,"options":{"min":0}},
            {"name":"playtime_seconds","type":"number","required":True,"options":{"min":0}},
            {"name":"last_seen","type":"date","required":True},
        ],
        "indexes": [
            "CREATE INDEX idx_players_wallet ON players (wallet_address)",
            "CREATE INDEX idx_players_highest_stage ON players (highest_stage DESC)",
            "CREATE INDEX idx_players_total_wins ON players (total_wins DESC)",
        ],
    }

def heroes_schema():
    return {
        **RULES_AUTH,
        "name": "heroes",
        "type": "base",
        "system": False,
        "schema": [
            {"name":"owner","type":"relation","options":{"collectionId":"players","cascadeDelete":True,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"name","type":"text","required":True},
            {"name":"class","type":"text","required":True},
            {"name":"rarity","type":"select","required":True,"options":{"maxSelect":1,"values":["common","uncommon","rare","epic","legendary","mythic"]}},
            {"name":"level","type":"number","required":True,"options":{"min":1,"max":100}},
            {"name":"exp","type":"number","required":True,"options":{"min":0}},
            {"name":"hp","type":"number","required":True,"options":{"min":1}},
            {"name":"atk","type":"number","required":True,"options":{"min":1}},
            {"name":"def","type":"number","required":True,"options":{"min":0}},
            {"name":"spd","type":"number","required":True,"options":{"min":1}},
            {"name":"crit","type":"number","required":True,"options":{"min":0,"max":100}},
            {"name":"skill_name","type":"text","required":True},
            {"name":"skill_type","type":"select","required":True,"options":{"maxSelect":1,"values":["physical","magical","heal","buff","debuff","aoe"]}},
            {"name":"skill_value","type":"number","required":True,"options":{"min":0}},
            {"name":"art_seed","type":"number","required":True},
            {"name":"on_chain_token_id","type":"text","required":False,"options":{"indexed":True}},
            {"name":"minted","type":"bool","required":True},
            {"name":"created_at","type":"date","required":True},
        ],
        "indexes": ["CREATE INDEX idx_heroes_owner ON heroes (owner)"],
    }

def battles_schema():
    return {
        **RULES_IMMUTABLE,
        "name": "battles",
        "type": "base",
        "system": False,
        "schema": [
            {"name":"player","type":"relation","options":{"collectionId":"players","cascadeDelete":True,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"stage","type":"number","required":True,"options":{"min":1}},
            {"name":"wave","type":"number","required":True,"options":{"min":1,"max":3}},
            {"name":"won","type":"bool","required":True},
            {"name":"hero_ids","type":"json","required":True},
            {"name":"gold_earned","type":"number","required":True,"options":{"min":0}},
            {"name":"exp_earned","type":"number","required":True,"options":{"min":0}},
            {"name":"duration_ms","type":"number","required":True,"options":{"min":0}},
            {"name":"battle_log","type":"json","required":False},
            {"name":"created_at","type":"date","required":True},
        ],
        "indexes": [
            "CREATE INDEX idx_battles_player ON battles (player)",
            "CREATE INDEX idx_battles_created ON battles (created_at DESC)",
        ],
    }

def listings_schema():
    return {
        **RULES_ADMIN_OR_AUTH,
        "name": "marketplace_listings",
        "type": "base",
        "system": False,
        "schema": [
            {"name":"seller","type":"relation","options":{"collectionId":"players","cascadeDelete":True,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"hero","type":"relation","options":{"collectionId":"heroes","cascadeDelete":False,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"on_chain_listing_id","type":"text","required":False,"options":{"indexed":True}},
            {"name":"price_wei","type":"text","required":True},
            {"name":"currency","type":"select","required":True,"options":{"maxSelect":1,"values":["BNB","PRC"]}},
            {"name":"status","type":"select","required":True,"options":{"maxSelect":1,"values":["active","sold","cancelled"]}},
            {"name":"listed_at","type":"date","required":True},
            {"name":"sold_at","type":"date","required":False},
        ],
        "indexes": ["CREATE INDEX idx_listings_status ON marketplace_listings (status)"],
    }

def achievements_schema():
    return {
        **RULES_AUTH,
        "name": "achievements",
        "type": "base",
        "system": False,
        "schema": [
            {"name":"player","type":"relation","options":{"collectionId":"players","cascadeDelete":True,"maxSelect":1,"minSelect":1,"required":True}},
            {"name":"achievement_id","type":"text","required":True},
            {"name":"title","type":"text","required":True},
            {"name":"description","type":"text","required":False},
            {"name":"progress","type":"number","required":True,"options":{"min":0,"max":100}},
            {"name":"unlocked","type":"bool","required":True},
            {"name":"unlocked_at","type":"date","required":False},
        ],
    }

def create_or_skip(name, payload, token):
    if exists(name, token):
        print(f"   [{name}] exists, skip")
        return True
    print(f"   [{name}] creating...")
    code, body = post_json("/api/collections", token, payload)
    if code == 200 and "id" in body:
        print(f"     ok (id={body['id']})")
        time.sleep(1)  # let PB cache settle
        return True
    else:
        print(f"     FAILED ({code}): {json.dumps(body)[:300]}")
        return False

def main():
    token = login()
    print(f"==> Admin token len: {len(token)}")
    print("==> Creating collections...")
    ok_count = 0
    for fname, sch_fn in [("players", players_schema), ("heroes", heroes_schema),
                           ("battles", battles_schema), ("marketplace_listings", listings_schema),
                           ("achievements", achievements_schema)]:
        if create_or_skip(fname, sch_fn(), token):
            ok_count += 1
    print(f"\n==> {ok_count}/5 collections ready")

    # Snapshot
    print("==> Snapshotting collections to migration file...")
    proc = subprocess.run(
        ["./pocketbase", "migrate", "collections",
         "--dir", f"{PB_DIR}/pb_data",
         "--migrationsDir", f"{PB_DIR}/pb_migrations"],
        cwd=PB_DIR, input=b"y\n", capture_output=True)
    print(proc.stdout.decode()[-800:] if proc.stdout else "")
    if proc.stderr:
        print("STDERR:", proc.stderr.decode()[-300:])

    # Final listing
    print("==> Final state:")
    data = get_json("/api/collections?fields=name,type&perPage=50", token)
    for c in data.get("items", []):
        print(f"   {c['name']:<30} {c['type']}")
    print("\n=== DONE ===")
    print(f"   Admin UI: http://www.brebross.xyz:8090/_/  (will be subdomained via nginx later)")
    print(f"   API base: {API}/api/")

if __name__ == "__main__":
    main()
