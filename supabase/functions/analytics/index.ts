import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST" } })
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { eventType, walletAddress, data } = await req.json()

    if (!eventType) {
      return new Response(JSON.stringify({ error: "eventType required" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } })
    }

    await supabase.from("analytics").insert({
      event_type: eventType,
      wallet_address: walletAddress?.toLowerCase(),
      data: data || {},
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})
