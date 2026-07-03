// Supabase Edge Function: validate-battle
// Server-side validation — cek apakah battle result masuk akal
// Deploy: supabase functions deploy validate-battle --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from "https://esm.sh/ethers@6"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Validasi battle result
function validateBattleResult(battleLog) {
  const issues = []

  // 1. Cek struktur data
  if (!battleLog.playerDeck || !battleLog.enemyDeck || !battleLog.result) {
    issues.push('Missing required fields')
  }

  // 2. Cek result type
  if (!['win', 'lose', 'draw'].includes(battleLog.result)) {
    issues.push('Invalid result type')
  }

  // 3. Cek deck size (max 5 hero per side)
  if (battleLog.playerDeck.length > 5 || battleLog.enemyDeck.length > 5) {
    issues.push('Deck size exceeds maximum')
  }

  // 4. Cek stats range (max 999 per stat)
  const MAX_STAT = 999
  const allCards = [...(battleLog.playerDeck || []), ...(battleLog.enemyDeck || [])]
  for (const card of allCards) {
    if (card.stats) {
      for (const [stat, val] of Object.entries(card.stats)) {
        if (val > MAX_STAT || val < 0) {
          issues.push(`Invalid ${stat} value: ${val}`)
        }
      }
    }
  }

  // 5. Cek reward amounts (anti-cheat)
  if (battleLog.result === 'win') {
    const maxGold = 500  // Max gold per win
    const maxExp = 100   // Max exp per win
    if (battleLog.rewards?.gold > maxGold) {
      issues.push(`Gold reward too high: ${battleLog.rewards.gold}`)
    }
    if (battleLog.rewards?.exp > maxExp) {
      issues.push(`Exp reward too high: ${battleLog.rewards.exp}`)
    }
  }

  // 6. Cek turn count (battle terlalu cepat = suspicious)
  if (battleLog.turns && battleLog.turns < 2) {
    issues.push('Battle too short (possible instant-win cheat)')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Parse body
    const battleLog = await req.json()
    const { walletAddress, timestamp, signature } = battleLog

    // NOTE: old code used supabase.auth.getUser(token), but client never
    // runs real Supabase Auth sign-in, so it always 401'd — every battle
    // save was silently skipped. Fixed with signature verification,
    // same pattern as save-progress and mint-card.
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: 'Invalid wallet address' }), { status: 400 })
    }
    if (!timestamp || !signature) {
      return new Response(JSON.stringify({ error: 'Missing timestamp or signature' }), { status: 400 })
    }
    const drift = Math.abs(Date.now() - Number(timestamp))
    if (isNaN(drift) || drift > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Signature expired, try again' }), { status: 401 })
    }
    const message = `PixelRaid save\nwallet:${walletAddress.toLowerCase()}\nts:${timestamp}`
    let recovered: string
    try {
      recovered = ethers.verifyMessage(message, signature)
    } catch {
      return new Response(JSON.stringify({ error: 'Bad signature' }), { status: 401 })
    }
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Signature does not match wallet' }), { status: 401 })
    }

    // Rate limit: max 30 validations per wallet per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const wallet = battleLog.walletAddress?.toLowerCase()
    if (wallet) {
      const { count } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'battle_validate')
        .eq('wallet_address', wallet)
        .gte('created_at', oneHourAgo)

      if (count && count >= 30) {
        return new Response(JSON.stringify({ error: 'Rate limit: max 30 validations per hour' }), { status: 429 })
      }
    }

    // Validasi
    const validation = validateBattleResult(battleLog)

    if (!validation.valid) {
      console.warn(`Suspicious battle from ${walletAddress}:`, validation.issues)
      return new Response(JSON.stringify({ 
        error: 'Invalid battle result',
        issues: validation.issues,
      }), { status: 400 })
    }

    // Jika valid, return success (client lanjut save ke Supabase)
    // Log analytics
    await supabase.from('analytics').insert({
      event_type: 'battle_validate',
      wallet_address: wallet,
      data: { result: battleLog.result, turns: battleLog.turns },
    }).select().maybeSingle()

    return new Response(JSON.stringify({
      valid: true,
      message: 'Battle result validated',
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Validation failed' 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
