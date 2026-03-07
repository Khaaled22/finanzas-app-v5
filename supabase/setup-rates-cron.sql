-- ============================================================
-- Setup: exchange_rates table + daily cron
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS exchange_rates (
  date DATE NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  eur_clp NUMERIC,
  eur_usd NUMERIC,
  clp_uf NUMERIC,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, base_currency)
);

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule daily cron at 08:00 UTC (10:00 Madrid / 05:00 Chile)
-- This calls the Edge Function fetch-rates every day
SELECT cron.schedule(
  'fetch-daily-rates',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/fetch-rates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To verify it's scheduled:
-- SELECT * FROM cron.job;

-- To see execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To remove if needed:
-- SELECT cron.unschedule('fetch-daily-rates');
