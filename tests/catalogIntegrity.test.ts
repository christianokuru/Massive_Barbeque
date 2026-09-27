import { describe, expect, it } from 'vitest';

// Server utils rely on the Nuxt createError global — stub it hermetically.
(globalThis as any).createError = (opts: any) =>
  Object.assign(new Error(opts?.statusMessage || 'error'), opts);

import { throwIfUniqueViolation } from '../server/utils/uniqueViolation';
import { storagePathForUrl } from '../server/utils/productStorage';

describe('throwIfUniqueViolation', () => {
  it('maps Postgres 23505 to a 409 with the given message', () => {
    try {
      throwIfUniqueViolation({ code: '23505', message: 'duplicate' }, 'Already exists.');
      expect.unreachable();
    } catch (e: any) {
      expect(e.statusCode).toBe(409);
      expect(e.statusMessage).toBe('Already exists.');
    }
  });

  it('rethrows anything else untouched', () => {
    const other = { code: 'other', message: 'boom' };
    expect(() => throwIfUniqueViolation(other, 'Already exists.')).toThrow('boom');
  });
});

describe('storagePathForUrl', () => {
  it('extracts the in-bucket path, stripping query strings', () => {
    expect(
      storagePathForUrl('https://xyz.supabase.co/storage/v1/object/public/product-images/admin-1.jpg?x=1'),
    ).toBe('admin-1.jpg');
  });

  it('returns null for external, local, traversal, and junk input', () => {
    expect(storagePathForUrl('https://cdn.example.com/a.jpg')).toBe(null);
    expect(storagePathForUrl('/images/food.jpg')).toBe(null);
    expect(storagePathForUrl('https://x/product-images/../secret')).toBe(null);
    expect(storagePathForUrl('')).toBe(null);
    expect(storagePathForUrl(null as any)).toBe(null);
  });
});
