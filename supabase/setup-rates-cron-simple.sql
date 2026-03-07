-- ============================================================
-- SIMPLE VERSION: Daily cron using hardcoded project URL
-- Use this if vault secrets are not set up
-- Run in Supabase Dashboard > SQL Editor
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

-- 3. Schedule daily cron at 08:00 UTC
-- IMPORTANT: Replace <YOUR_SERVICE_ROLE_KEY> with your actual service_role key
-- Find it in: Supabase Dashboard > Settings > API > service_role key
SELECT cron.schedule(
  'fetch-daily-rates',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ovjxpyaneianxetahfji.supabase.co/functions/v1/fetch-rates',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify:
-- SELECT * FROM cron.job;
