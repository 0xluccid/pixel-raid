#!/bin/bash
# Usage: ./setup-admin.sh admin@pixel.brebross.xyz YourSecurePass123
EMAIL="${1:-admin@pixel.brebross.xyz}"
PASS="${2:-PixelRaidAdmin2026!}"

cd /root/pixel-raid/pocketbase
./pocketbase superuser upsert "$EMAIL" "$PASS" --dir=/root/pixel-raid/pocketbase/pb_data 2>&1
