#!/bin/bash
# Pixel Raid: Setup Relayer Wallet untuk mint-card Edge Function
# Jalankan di server yg sama dengan Supabase project

echo "🔧 Setting up Relayer Wallet..."

# Set RELAYER_PRIVATE_KEY di Supabase Secrets
# Ganti <PRIVATE_KEY> dengan private key wallet Bre (yg jadi owner contract)

# Method 1: Via Supabase Dashboard
echo "1. Buka: https://supabase.com/dashboard/project/hchrdclodhasoxvjfxss/settings/functions"
echo "2. Tambah secret: RELAYER_PRIVATE_KEY = <private_key_wallet_Bre>"
echo "3. Klik Save"

# Method 2: Via Supabase CLI (kalau udah install)
# supabase secrets set RELAYER_PRIVATE_KEY=<private_key_wallet_Bre>

echo ""
echo "⚠️  PENTING:"
echo "- Private key ini JANGAN pernah commit ke git"
echo "- Gunakan wallet khusus relayer (bukan wallet utama)"
echo "- Isi wallet relayer dengan sedikit BNB untuk gas"
echo ""

# Deploy Edge Functions
echo "📦 Deploy Edge Functions..."
echo "Run: supabase functions deploy mint-card"
echo "Run: supabase functions deploy validate-battle"

echo ""
echo "✅ Setup selesai!"
