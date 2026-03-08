// src/modules/supabase/syncUtils.js
// Sync with Supabase user_data table.
// localStorage remains the primary/offline store; Supabase is the cloud backup.
// Merge strategy: item-level merge by id using timestamps for conflict resolution.

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
      .maybeSingle();

    if (error) return null;
    return data?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Save data for a key to Supabase.
 * Returns true on success, false on any failure.
 * localStorage remains the source of truth locally.
 */
export async function saveToSupabase(key, value) {
  if (!isBackendEnabled()) return false;
  try {
    const supabase = await getSupabase();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from('user_data').upsert(
      { user_id: user.id, key, data: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
    return !error;
  } catch {
    return false;
  }
}

// =====================================================
// MERGE UTILITIES
// =====================================================

/**
 * Get the most recent timestamp from an item for conflict resolution.
 * Checks updatedAt first, then createdAt, falls back to epoch.
 */
function getItemTimestamp(item) {
  const ts = item.updatedAt || item.createdAt || '1970-01-01T00:00:00Z';
  return new Date(ts).getTime();
}

const PURGE_DAYS = 30;

/**
 * Merge two arrays of items by `id` field.
 *
 * Rules:
 * - Items only in cloud  -> add (someone else created them)
 * - Items only in local  -> keep (created offline, not yet synced)
 * - Items in both        -> keep the one with newer updatedAt/createdAt
 * - Soft-deleted items (_deleted: true) propagate: if the newer version is deleted, it stays deleted
 * - Purge soft-deleted items older than PURGE_DAYS
 *
 * Returns the merged array (including _deleted items for storage).
 */
export function mergeArrayById(localArray, cloudArray) {
  if (!Array.isArray(cloudArray) || cloudArray.length === 0) return localArray || [];
  if (!Array.isArray(localArray) || localArray.length === 0) return cloudArray;

  const merged = new Map();
  const now = Date.now();
  const purgeThreshold = now - (PURGE_DAYS * 24 * 60 * 60 * 1000);

  // Add all local items
  for (const item of localArray) {
    if (item.id) merged.set(item.id, item);
  }

  // Merge cloud items
  for (const cloudItem of cloudArray) {
    if (!cloudItem.id) continue;
    const localItem = merged.get(cloudItem.id);

    if (!localItem) {
      // Only in cloud — add it
      merged.set(cloudItem.id, cloudItem);
    } else {
      // In both — keep newer
      const localTs = getItemTimestamp(localItem);
      const cloudTs = getItemTimestamp(cloudItem);
      if (cloudTs > localTs) {
        merged.set(cloudItem.id, cloudItem);
      }
      // else keep local (already in map)
    }
  }

  // Purge old soft-deleted items
  const result = [];
  for (const item of merged.values()) {
    if (item._deleted && item._deletedAt) {
      const deletedTs = new Date(item._deletedAt).getTime();
      if (deletedTs < purgeThreshold) continue; // purge
    }
    result.push(item);
  }

  return result;
}

/**
 * Deduplicate transactions by content (date+description+amount+currency+categoryId).
 * Keeps the first occurrence (by createdAt) and removes later duplicates.
 * This catches duplicates that have different IDs but identical content.
 */
export function deduplicateByContent(array) {
  if (!Array.isArray(array) || array.length === 0) return array;
  const seen = new Map();
  const result = [];
  for (const item of array) {
    // Only deduplicate items that look like transactions (have date + amount)
    if (item.date && item.amount !== undefined) {
      const key = `${item.date}|${item.description || ''}|${item.amount}|${item.currency || ''}|${item.categoryId || ''}`;
      if (seen.has(key)) continue;
      seen.set(key, true);
    }
    result.push(item);
  }
  return result;
}

/**
 * Filter out soft-deleted items for UI consumption.
 * Call this when exposing data to components.
 */
export function filterActive(array) {
  if (!Array.isArray(array)) return [];
  return array.filter(item => !item._deleted);
}

/**
 * Soft-delete an item: marks it as deleted instead of removing it.
 * Returns a new array with the item marked.
 */
export function softDelete(array, itemId) {
  const now = new Date().toISOString();
  return array.map(item =>
    item.id === itemId
      ? { ...item, _deleted: true, _deletedAt: now, updatedAt: now }
      : item
  );
}
