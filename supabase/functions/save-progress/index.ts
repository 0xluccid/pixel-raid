// Supabase Edge Function: save-progress
// Fixes: RLS "app.wallet" trust bug — anyone could set_config to any wallet
// and update any player's row. Now the client must SIGN a message with the
// wallet's private key; we verify it server-side (service role bypasses RLS,
// but only after signature check passes).
// Deploy: supabase functions deploy save-progress --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from "https://esm.sh/ethers@6"
import { getCorsHeaders } from "../_shared/cors.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Signature must be for a message younger than this (replay protection)
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000 // 5 minutes

serve(async (req) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { walletAddress, timestamp, signature, update } = await req.json()

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: 'Invalid wallet address' }), { status: 400, headers: cors })
    }
    if (!timestamp || !signature || !update) {
      return new Response(JSON.stringify({ error: 'Missing timestamp, signature, or update' }), { status: 400, headers: cors })
    }

    // Replay protection: reject stale/future timestamps
    const drift = Math.abs(Date.now() - Number(timestamp))
    if (isNaN(drift) || drift > MAX_TIMESTAMP_DRIFT_MS) {
      return new Response(JSON.stringify({ error: 'Signature expired, try again' }), { status: 401, headers: cors })
    }

    // The client must sign this exact message
    const message = `PixelRaid save\nwallet:${walletAddress.toLowerCase()}\nts:${timestamp}`

    let recovered: string
    try {
      recovered = ethers.verifyMessage(message, signature)
    } catch {
      return new Response(JSON.stringify({ error: 'Bad signature' }), { status: 401, headers: cors })
    }

    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Signature does not match wallet' }), { status: 401, headers: cors })
    }

    // Only allow known, safe fields to be updated — never trust arbitrary keys
    const ALLOWED_FIELDS = [
      'display_name', 'level', 'exp', 'gold', 'gem',
      'current_stage', 'highest_stage', 'total_battles',
      'total_wins', 'win_streak', 'data_checksum',
    ]
    const safeUpdate: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in update) safeUpdate[key] = update[key]
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    const { error } = await supabase
      .from('players')
      .update(safeUpdate)
      .eq('wallet_address', walletAddress.toLowerCase())

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: cors })
  }
})
