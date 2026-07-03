// Supabase Edge Function: leaderboard
// Server-side cached leaderboard — reduce read pressure on players table
// Deploy: supabase functions deploy leaderboard --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// In-memory cache (reset on cold start, shared across requests)
let cachedLeaderboard = null
let cacheTimestamp = 0
const CACHE_TTL = 30_000 // 30 detik

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    const url = new URL(req.url)
    const sortBy = url.searchParams.get('sort') || 'highest_stage' // highest_stage | total_wins | level
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

    // Validasi sort field
    const allowedSorts = ['highest_stage', 'total_wins', 'level', 'win_streak']
    if (!allowedSorts.includes(sortBy)) {
      return new Response(JSON.stringify({ error: 'Invalid sort field' }), { status: 400 })
    }

    const cacheKey = `${sortBy}:${limit}`
    const now = Date.now()

    // Return cache kalau masih fresh
    if (cachedLeaderboard?.[cacheKey] && (now - cacheTimestamp) < CACHE_TTL) {
      return new Response(JSON.stringify({
        data: cachedLeaderboard[cacheKey],
        cached: true,
        cached_at: new Date(cacheTimestamp).toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=30',
        },
      })
    }

    // Query Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data, error } = await supabase
      .from('players')
      .select('wallet_address, display_name, level, highest_stage, total_wins, total_battles, win_streak')
      .order(sortBy, { ascending: false })
      .limit(limit)

    if (error) throw error

    // Update cache
    if (!cachedLeaderboard) cachedLeaderboard = {}
    cachedLeaderboard[cacheKey] = data
    cacheTimestamp = now

    return new Response(JSON.stringify({
      data,
      cached: false,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
