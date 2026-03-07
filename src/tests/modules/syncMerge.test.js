// src/tests/modules/syncMerge.test.js
import { describe, it, expect } from 'vitest';
import { mergeArrayById, filterActive, softDelete } from '../../modules/supabase/syncUtils';

describe('mergeArrayById', () => {
  it('returns local array when cloud is null/empty', () => {
    const local = [{ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' }];
    expect(mergeArrayById(local, null)).toEqual(local);
    expect(mergeArrayById(local, [])).toEqual(local);
  });

  it('returns cloud array when local is null/empty', () => {
    const cloud = [{ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' }];
    expect(mergeArrayById(null, cloud)).toEqual(cloud);
    expect(mergeArrayById([], cloud)).toEqual(cloud);
  });

  it('merges items only in cloud (new from other device)', () => {
    const local = [{ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' }];
    const cloud = [
      { id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'B', createdAt: '2026-01-02T00:00:00Z' }
    ];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(2);
    expect(result.find(i => i.id === '2')).toBeDefined();
  });

  it('keeps items only in local (created offline)', () => {
    const local = [
      { id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' },
      { id: '3', name: 'C', createdAt: '2026-01-03T00:00:00Z' }
    ];
    const cloud = [{ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(2);
    expect(result.find(i => i.id === '3')).toBeDefined();
  });

  it('keeps newer version when item exists in both (cloud newer)', () => {
    const local = [{ id: '1', name: 'Old', updatedAt: '2026-01-01T00:00:00Z' }];
    const cloud = [{ id: '1', name: 'New', updatedAt: '2026-01-02T00:00:00Z' }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('New');
  });

  it('keeps newer version when item exists in both (local newer)', () => {
    const local = [{ id: '1', name: 'Newer', updatedAt: '2026-01-03T00:00:00Z' }];
    const cloud = [{ id: '1', name: 'Older', updatedAt: '2026-01-01T00:00:00Z' }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Newer');
  });

  it('uses createdAt as fallback when updatedAt is missing', () => {
    const local = [{ id: '1', name: 'Old', createdAt: '2026-01-01T00:00:00Z' }];
    const cloud = [{ id: '1', name: 'New', createdAt: '2026-01-05T00:00:00Z' }];
    const result = mergeArrayById(local, cloud);
    expect(result[0].name).toBe('New');
  });

  it('full scenario: both devices add items + one edits existing', () => {
    const local = [
      { id: '1', name: 'Shared', updatedAt: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'Local Only', createdAt: '2026-01-05T00:00:00Z' }
    ];
    const cloud = [
      { id: '1', name: 'Shared Edited', updatedAt: '2026-01-03T00:00:00Z' },
      { id: '3', name: 'Cloud Only', createdAt: '2026-01-04T00:00:00Z' }
    ];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(3);
    expect(result.find(i => i.id === '1').name).toBe('Shared Edited');
    expect(result.find(i => i.id === '2').name).toBe('Local Only');
    expect(result.find(i => i.id === '3').name).toBe('Cloud Only');
  });

  it('propagates soft-delete from cloud', () => {
    const local = [{ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' }];
    const cloud = [{ id: '1', name: 'A', _deleted: true, _deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0]._deleted).toBe(true);
  });

  it('purges old soft-deleted items (>30 days)', () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const local = [{ id: '1', _deleted: true, _deletedAt: oldDate, updatedAt: oldDate }];
    const cloud = [{ id: '1', _deleted: true, _deletedAt: oldDate, updatedAt: oldDate }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(0);
  });

  it('skips items without id', () => {
    const local = [{ id: '1', name: 'A' }, { name: 'No ID' }];
    const cloud = [{ id: '1', name: 'A' }];
    const result = mergeArrayById(local, cloud);
    expect(result).toHaveLength(1);
  });
});

describe('filterActive', () => {
  it('filters out soft-deleted items', () => {
    const items = [
      { id: '1', name: 'Active' },
      { id: '2', name: 'Deleted', _deleted: true },
      { id: '3', name: 'Also Active' }
    ];
    const result = filterActive(items);
    expect(result).toHaveLength(2);
    expect(result.every(i => !i._deleted)).toBe(true);
  });

  it('handles non-array input', () => {
    expect(filterActive(null)).toEqual([]);
    expect(filterActive(undefined)).toEqual([]);
  });
});

describe('softDelete', () => {
  it('marks item as deleted with timestamp', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' }
    ];
    const result = softDelete(items, '1');
    expect(result).toHaveLength(2);
    expect(result[0]._deleted).toBe(true);
    expect(result[0]._deletedAt).toBeDefined();
    expect(result[0].updatedAt).toBeDefined();
    expect(result[1]._deleted).toBeUndefined();
  });

  it('does not modify other items', () => {
    const items = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    const result = softDelete(items, '1');
    expect(result[1]).toEqual(items[1]);
  });
});
