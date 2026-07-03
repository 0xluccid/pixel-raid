// Supabase Edge Function: mint-card
// Server-side minting — client hanya request, server yg submit tx ke contract
// Deploy: supabase functions deploy mint-card --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

// Config
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RELAYER_PRIVATE_KEY = Deno.env.get('RELAYER_PRIVATE_KEY') // Bre's wallet private key
const RPC_URL = Deno.env.get('BSC_RPC_URL') || 'https://data-seed-prebsc-1-s1.binance.org:8545'
const CONTRACT_ADDRESS = '0xFB44693a41CaFAa2CfeDb7694A2b7F70A41F7C13'

// ABI — hanya fungsi yg dibutuhkan
const ABI = [
  "function mintCard(address to, string name, string heroClass, string rarity, uint256 hp, uint256 atk, uint256 def, uint256 spd, uint256 crit, string skillName, string skillType, uint256 skillVal, uint256 artSeed) returns (uint256)",
  "event CardMinted(uint256 indexed tokenId, address indexed to, string heroClass, string rarity)"
]

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // Auth — ambil user dari JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), { status: 401 })
    }

    // Parse body
    const { walletAddress, card } = await req.json()

    // Validasi
    if (!walletAddress || !card) {
      return new Response(JSON.stringify({ error: 'Missing walletAddress or card' }), { status: 400 })
    }

    // Validasi card data (anti-cheat: cek stats range)
    const MAX_STAT = 999
    const stats = card.stats || {}
    if (stats.hp > MAX_STAT || stats.atk > MAX_STAT || stats.def > MAX_STAT || 
        stats.spd > MAX_STAT || stats.crit > MAX_STAT) {
      return new Response(JSON.stringify({ error: 'Invalid stats' }), { status: 400 })
    }

    // Validasi rarity
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
    if (!validRarities.includes(card.rarity?.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Invalid rarity' }), { status: 400 })
    }

    // Setup provider & relayer wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, relayer)

    // Submit tx
    console.log(`Minting card for ${walletAddress}: ${card.name} (${card.rarity})`)
    
    const tx = await contract.mintCard(
      walletAddress,
      card.name,
      card.class,
      card.rarity,
      stats.hp,
      stats.atk,
      stats.def,
      stats.spd,
      stats.crit,
      card.skill?.name || '',
      card.skill?.type || 'damage',
      card.skill?.val || 0,
      card.artSeed || 0
    )

    console.log(`Tx sent: ${tx.hash}`)
    const receipt = await tx.wait()

    // Extract token ID dari event
    let tokenId = null
    const iface = new ethers.Interface(ABI)
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === 'CardMinted') {
          tokenId = Number(parsed.args.tokenId)
          break
        }
      } catch (_) {}
    }

    // Log ke Supabase (optional: tabel mint_logs)
    await supabase.from('mint_logs').insert({
      user_id: user.id,
      wallet_address: walletAddress.toLowerCase(),
      token_id: tokenId,
      card_name: card.name,
      card_rarity: card.rarity,
      tx_hash: tx.hash,
    }).select().maybeSingle() // ignore error jika tabel blom ada

    return new Response(JSON.stringify({
      success: true,
      tokenId,
      txHash: tx.hash,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Mint error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Mint failed' 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
