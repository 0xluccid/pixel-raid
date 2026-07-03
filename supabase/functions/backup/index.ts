import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

    // Export players table
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("*")

    if (playersError) throw playersError

    // Export analytics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString()
    const { data: analytics, error: analyticsError } = await supabase
      .from("analytics")
      .select("*")
      .gte("created_at", thirtyDaysAgo)

    if (analyticsError) throw analyticsError

    // Create backup JSON
    const backup = {
      timestamp: new Date().toISOString(),
      players: players || [],
      analytics: analytics || [],
    }

    const backupJson = JSON.stringify(backup, null, 2)
    const filename = `backup_${new Date().toISOString().split("T")[0]}.json`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(filename, backupJson, {
        contentType: "application/json",
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Cleanup old backups (keep last 4)
    const { data: files } = await supabase.storage.from("backups").list()
    if (files && files.length > 4) {
      const oldFiles = files
        .sort((a, b) => b.name.localeCompare(a.name))
        .slice(4)
        .map(f => f.name)
      await supabase.storage.from("backups").remove(oldFiles)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      filename,
      players: players?.length || 0,
      analytics: analytics?.length || 0,
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Backup error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
