// supabase/functions/backfill-rates/index.ts
// One-time Edge Function: backfills historical rates from 2024-01-01 to today
// Call manually: POST /functions/v1/backfill-rates
// Optional body: { "from": "2024-01-01", "to": "2024-12-31" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchEURForDate(date: string): Promise<{ CLP: number; USD: number } | null> {
  try {
    // exchangerate-api.com doesn't have historical on free plan
    // Use frankfurter.app (ECB data, free, has history back to 1999)
    const res = await fetch(`https://api.frankfurter.app/${date}?to=CLP,USD`);
    if (!res.ok) return null;
    const data = await res.json();
    return { CLP: data.rates.CLP, USD: data.rates.USD };
  } catch {
    return null;
  }
}

async function fetchUFForDate(date: string): Promise<number | null> {
  try {
    // mindicador.cl supports historical dates
    const res = await fetch(`https://mindicador.cl/api/uf/${date}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.serie || data.serie.length === 0) return null;
    return data.serie[0].valor;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const fromDate = new Date(body.from || "2024-01-01");
    const toDate = new Date(body.to || new Date().toISOString().slice(0, 10));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get existing dates to skip them
    const { data: existing } = await supabase
      .from("exchange_rates")
      .select("date")
      .gte("date", formatDate(fromDate))
      .lte("date", formatDate(toDate));

    const existingDates = new Set((existing || []).map((r: { date: string }) => r.date));

    // Build list of missing dates (only weekdays - markets are closed on weekends)
    const missingDates: string[] = [];
    let current = new Date(fromDate);
    while (current <= toDate) {
      const day = current.getDay();
      const dateStr = formatDate(current);
      if (day !== 0 && day !== 6 && !existingDates.has(dateStr)) {
        missingDates.push(dateStr);
      }
      current = addDays(current, 1);
    }

    if (missingDates.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No missing dates", filled: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process in batches of 5 to avoid rate limits
    const results: { date: string; success: boolean }[] = [];
    const batchSize = 5;

    for (let i = 0; i < missingDates.length; i += batchSize) {
      const batch = missingDates.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (date) => {
          const [eurRates, ufRate] = await Promise.all([fetchEURForDate(date), fetchUFForDate(date)]);

          if (!eurRates) return { date, success: false };

          const { error } = await supabase.from("exchange_rates").upsert(
            {
              date,
              base_currency: "EUR",
              eur_clp: eurRates.CLP,
              eur_usd: eurRates.USD,
              clp_uf: ufRate,
              source: "backfill",
            },
            { onConflict: "date,base_currency" }
          );

          return { date, success: !error };
        })
      );

      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < missingDates.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    const filled = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return new Response(
      JSON.stringify({
        success: true,
        total: missingDates.length,
        filled,
        failed: failed.length,
        failedDates: failed.map((r) => r.date),
        range: { from: formatDate(fromDate), to: formatDate(toDate) },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
