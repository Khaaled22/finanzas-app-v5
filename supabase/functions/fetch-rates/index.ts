// supabase/functions/fetch-rates/index.ts
// Supabase Edge Function: fetches daily exchange rates and stores them
// Called by pg_cron daily at 08:00 UTC

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RatesResult {
  EUR_CLP: number | null;
  EUR_USD: number | null;
  USD_CLP: number | null;
  CLP_UF: number | null;
}

async function fetchEURRates(): Promise<{ success: boolean; rates?: { CLP: number; USD: number }; error?: string }> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/EUR", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      rates: { CLP: data.rates.CLP, USD: data.rates.USD },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function fetchUF(): Promise<{ success: boolean; rate?: number; error?: string }> {
  try {
    const res = await fetch("https://mindicador.cl/api/uf", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.serie || data.serie.length === 0) throw new Error("No UF data");
    return { success: true, rate: data.serie[0].valor };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Fetch rates from both sources in parallel
    const [eurResult, ufResult] = await Promise.all([fetchEURRates(), fetchUF()]);

    const rates: RatesResult = {
      EUR_CLP: eurResult.success ? eurResult.rates!.CLP : null,
      EUR_USD: eurResult.success ? eurResult.rates!.USD : null,
      USD_CLP:
        eurResult.success && eurResult.rates!.CLP && eurResult.rates!.USD
          ? eurResult.rates!.CLP / eurResult.rates!.USD
          : null,
      CLP_UF: ufResult.success ? ufResult.rate! : null,
    };

    // Need at least EUR rates
    if (!rates.EUR_CLP) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch EUR rates",
          details: { eur: eurResult.error, uf: ufResult.error },
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().slice(0, 10);

    const { error: dbError } = await supabase.from("exchange_rates").upsert(
      {
        date: today,
        base_currency: "EUR",
        eur_clp: rates.EUR_CLP,
        eur_usd: rates.EUR_USD,
        clp_uf: rates.CLP_UF,
        source: "cron",
      },
      { onConflict: "date,base_currency" }
    );

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        rates,
        sources: {
          EUR_CLP: "exchangerate-api.com",
          EUR_USD: "exchangerate-api.com",
          CLP_UF: ufResult.success ? "mindicador.cl" : "unavailable",
        },
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
