// Supabase Edge Function: mint-card
// Server-side minting — client tidak punya akses ke private key
// Deploy: supabase functions deploy mint-card --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from "https://esm.sh/ethers@6"
import { getCorsHeaders } from "../_shared/cors.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RELAYER_PRIVATE_KEY = Deno.env.get('RELAYER_PRIVATE_KEY')
const RPC_URL = Deno.env.get('BSC_RPC_URL') || 'https://bsc-testnet-rpc.publicnode.com'
const CONTRACT_ADDRESS = '0xFB44693a41CaFAa2CfeDb7694A2b7F70A41F7C13'

// Telegram alert
const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TG_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')

async function alertTelegram(msg: string) {
  if (!TG_TOKEN || !TG_CHAT) return
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: `🚨 Pixel Raid: ${msg}`, parse_mode: 'HTML' }),
    })
  } catch (_) { /* fire-and-forget */ }
}

// Input sanitization
const VALID_CLASSES = ['warrior', 'mage', 'archer', 'healer', 'assassin']
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic']
const STAT_MAX = 999
const NAME_MAX_LEN = 30

function sanitizeCard(card: Record<string, unknown>): string[] {
  const issues: string[] = []
  const name = card.name as string
  const cls = card.class as string
  const rarity = card.rarity as string
  const stats = card.stats as Record<string, number> | undefined
  const skill = card.skill as Record<string, unknown> | undefined

  if (!name || typeof name !== 'string') issues.push('Missing card name')
  else if (name.length > NAME_MAX_LEN) issues.push(`Name too long (max ${NAME_MAX_LEN})`)
  else if (/<script|javascript:|on\w+=/i.test(name)) issues.push('XSS in card name')

  if (!VALID_CLASSES.includes(cls)) issues.push(`Invalid class: ${cls}`)
  if (!VALID_RARITIES.includes(rarity)) issues.push(`Invalid rarity: ${rarity}`)

  if (stats) {
    const hp = Number(stats.hp), atk = Number(stats.atk), def = Number(stats.def)
    const spd = Number(stats.spd), crit = Number(stats.crit)
    if (isNaN(hp) || hp < 1 || hp > STAT_MAX) issues.push(`Invalid hp: ${hp}`)
    if (isNaN(atk) || atk < 0 || atk > STAT_MAX) issues.push(`Invalid atk: ${atk}`)
    if (isNaN(def) || def < 0 || def > STAT_MAX) issues.push(`Invalid def: ${def}`)
    if (isNaN(spd) || spd < 0 || spd > STAT_MAX) issues.push(`Invalid spd: ${spd}`)
    if (isNaN(crit) || crit < 0 || crit > 100) issues.push(`Invalid crit: ${crit}`)
  } else {
    issues.push('Missing stats')
  }

  if (!skill?.name || !skill?.type) issues.push('Missing skill')
  else if (!['damage', 'heal', 'buff', 'debuff'].includes(skill.type as string)) issues.push(`Invalid skill type: ${skill.type}`)

  return issues
}

const ABI = [
  'function mintCard(address to, string name, string className, string rarity, uint256 hp, uint256 atk, uint256 def, uint256 spd, uint256 crit, string skillName, string skillType, uint256 skillValue, uint256 artSeed) returns (uint256)',
  'event CardMinted(uint256 indexed tokenId, address indexed owner, string name, string rarity)',
]

serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // NOTE: the client never actually runs Supabase Auth sign-in, so
    // supabase.auth.getUser(token) here always failed (401) before this
    // fix — minting was silently broken. We verify wallet ownership via
    // signature instead, same pattern as save-progress.
    const { walletAddress, card, timestamp, signature } = await req.json()

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: 'Invalid wallet address' }), { status: 400, headers: cors })
    }
    if (!timestamp || !signature) {
      return new Response(JSON.stringify({ error: 'Missing timestamp or signature' }), { status: 400, headers: cors })
    }

    const drift = Math.abs(Date.now() - Number(timestamp))
    if (isNaN(drift) || drift > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Signature expired, try again' }), { status: 401, headers: cors })
    }

    const message = `PixelRaid mint\nwallet:${walletAddress.toLowerCase()}\nts:${timestamp}`
    let recovered: string
    try {
      recovered = ethers.verifyMessage(message, signature)
    } catch {
      return new Response(JSON.stringify({ error: 'Bad signature' }), { status: 401, headers: cors })
    }
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Signature does not match wallet' }), { status: 401, headers: cors })
    }

    // Rate limit: max 5 mints/wallet/hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { count } = await supabase
      .from('mint_logs')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress?.toLowerCase())
      .gte('created_at', oneHourAgo)

    if (count && count >= 5) {
      return new Response(JSON.stringify({ error: 'Rate limit: max 5 mints per hour' }), { status: 429, headers: cors })
    }

    if (!walletAddress || !card) {
      return new Response(JSON.stringify({ error: 'Missing walletAddress or card' }), { status: 400, headers: cors })
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: 'Invalid wallet address' }), { status: 400, headers: cors })
    }

    const sanitIssues = sanitizeCard(card)
    if (sanitIssues.length > 0) {
      await alertTelegram(`Invalid card input from ${walletAddress.slice(0, 10)}...: ${sanitIssues.join(', ')}`)
      return new Response(JSON.stringify({ error: 'Invalid card data', issues: sanitIssues }), { status: 400, headers: cors })
    }

    if (!RELAYER_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Relayer not configured' }), { status: 500, headers: cors })
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, relayer)

    const artSeed = Math.floor(Math.random() * 1000000)

    let gasEstimate
    try {
      gasEstimate = await contract.mintCard.estimateGas(
        walletAddress, card.name, card.class, card.rarity,
        card.stats.hp, card.stats.atk, card.stats.def,
        card.stats.spd, card.stats.crit,
        card.skill.name, card.skill.type, card.skill.val,
        artSeed
      )
    } catch (gasErr: unknown) {
      const msg = gasErr instanceof Error ? gasErr.message : String(gasErr)
      await alertTelegram(`Gas estimation failed for ${walletAddress.slice(0, 10)}...: ${msg.slice(0, 200)}`)
      return new Response(JSON.stringify({ error: 'Gas estimation failed', details: msg }), { status: 400, headers: cors })
    }

    const tx = await contract.mintCard(
      walletAddress, card.name, card.class, card.rarity,
      card.stats.hp, card.stats.atk, card.stats.def,
      card.stats.spd, card.stats.crit,
      card.skill.name, card.skill.type, card.skill.val,
      artSeed,
      { gasLimit: gasEstimate * 12n / 10n }
    )

    const receipt = await tx.wait()

    let tokenId = null
    const iface = new ethers.Interface(ABI)
    for (const log of receipt.logs || []) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed?.name === 'CardMinted') {
          tokenId = Number(parsed.args.tokenId)
          break
        }
      } catch (_) { /* skip */ }
    }

    await supabase.from('mint_logs').insert({
      wallet_address: walletAddress.toLowerCase(),
      token_id: tokenId,
      hero_class: card.class,
      rarity: card.rarity,
      tx_hash: tx.hash,
    })

    return new Response(JSON.stringify({
      success: true,
      tokenId,
      txHash: tx.hash,
      artSeed,
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Mint error:', msg)
    await alertTelegram(`Mint error: ${msg.slice(0, 300)}`)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: cors })
  }
})
