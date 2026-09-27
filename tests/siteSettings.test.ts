import { describe, expect, it } from 'vitest';
import { settingsSchema } from '../server/utils/siteSettings';

describe('settingsSchema', () => {
  it('accepts whole-Naira fees including free delivery', () => {
    expect(settingsSchema.safeParse({ deliveryFee: 2000 }).success).toBe(true);
    expect(settingsSchema.safeParse({ deliveryFee: 0 }).success).toBe(true);
  });

  it('rejects negative, absurd, and non-numeric fees', () => {
    expect(settingsSchema.safeParse({ deliveryFee: -1 }).success).toBe(false);
    expect(settingsSchema.safeParse({ deliveryFee: 100001 }).success).toBe(false);
    expect(settingsSchema.safeParse({ deliveryFee: NaN }).success).toBe(false);
    expect(settingsSchema.safeParse({}).success).toBe(false);
  });
});
