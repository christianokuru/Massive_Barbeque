import { describe, expect, it } from 'vitest';
import { addressSchema } from '../server/utils/addressbook';

const valid = {
  firstName: 'Ada',
  lastName: 'Obi',
  phone: '08030000000',
  addressLine1: '12 Grill Close',
  city: 'Lagos',
  state: 'Lagos',
};

describe('addressSchema', () => {
  it('accepts a complete address', () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional second line and postal code', () => {
    const r = addressSchema.safeParse({ ...valid, addressLine2: 'Off Smoke Rd', postalCode: '100001' });
    expect(r.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(addressSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, addressLine1: '' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, city: '' }).success).toBe(false);
  });

  it('enforces field caps', () => {
    expect(addressSchema.safeParse({ ...valid, phone: '1'.repeat(31) }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, addressLine1: 'a'.repeat(301) }).success).toBe(false);
  });
});
