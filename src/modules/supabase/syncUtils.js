// src/modules/supabase/syncUtils.js
// Simple key-value sync with Supabase user_data table.
// localStorage remains the primary/offline store; Supabase is the cloud backup.

const isBackendEnabled = () => import.meta.env.VITE_USE_BACKEND === 'true';

const getSupabase = async () => {
  try {
    const { supabase } = await import('./client');
    return supabase;
  } catch {
    return null;
  }
};

/**
 * Load data for a key from Supabase.
 * Returns null if backend disabled, not authenticated, table missing, or any error.
 */
export async function loadFromSupabase(key) {
  if (!isBackendEnabled()) return null;
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', user.id)
      .eq('key', key)
      .single();

    if (error) return null; // PGRST116 = row not found, other errors also silent
    return data?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Save data for a key to Supabase (fire-and-forget).
 * Silently fails if backend disabled, not authenticated, or any error.
 */
export async function saveToSupabase(key, value) {
  if (!isBackendEnabled()) return;
  try {
    const supabase = await getSupabase();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_data').upsert(
      { user_id: user.id, key, data: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
  } catch {
    // Silent fail — localStorage is the source of truth locally
  }
}
