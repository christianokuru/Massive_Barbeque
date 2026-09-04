import { describe, expect, it } from 'vitest';
import {
  DELIVERY_FEE_FLAT,
  cartSubtotal,
  deliveryFeeFor,
  formatNaira,
  lineTotal,
  orderTotals,
  toAmount,
  toKobo,
} from '../shared/utils/pricing';

describe('toAmount (decimal-string parsing)', () => {
  it('parses Postgres decimal strings', () => {
    expect(toAmount('4500.00')).toBe(4500);
    expect(toAmount('1999.99')).toBeCloseTo(1999.99);
  });

  it('passes numbers through', () => {
    expect(toAmount(250)).toBe(250);
  });

  it('returns 0 for null, undefined, and garbage', () => {
    expect(toAmount(null)).toBe(0);
    expect(toAmount(undefined)).toBe(0);
    expect(toAmount('not-a-price')).toBe(0);
    expect(toAmount('')).toBe(0);
  });
});

describe('lineTotal', () => {
  it('multiplies decimal-string price by quantity', () => {
    expect(lineTotal('4500.00', 2)).toBe(9000);
  });

  it('treats zero/negative quantities as 0', () => {
    expect(lineTotal('4500.00', 0)).toBe(0);
    expect(lineTotal('4500.00', -1)).toBe(0);
  });
});

describe('cartSubtotal', () => {
  it('sums mixed decimal-string lines', () => {
    const items = [
      { price: '4500.00', quantity: 2 }, // 9000
      { price: '2500.50', quantity: 1 }, // 2500.50
      { price: '1200', quantity: 3 }, // 3600
    ];
    expect(cartSubtotal(items)).toBeCloseTo(15100.5);
  });

  it('is 0 for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0);
  });
});

describe('delivery fee (Batch 2 contract)', () => {
  it('charges the flat fee for delivery', () => {
    expect(deliveryFeeFor('delivery')).toBe(2000);
    expect(DELIVERY_FEE_FLAT).toBe(2000);
  });

  it('charges nothing for pickup', () => {
    expect(deliveryFeeFor('pickup')).toBe(0);
  });

  it('adds the fee to the total for delivery only', () => {
    expect(orderTotals(15100.5, 'delivery')).toEqual({
      subtotal: 15100.5,
      deliveryFee: 2000,
      total: 17100.5,
    });
    expect(orderTotals(15100.5, 'pickup')).toEqual({
      subtotal: 15100.5,
      deliveryFee: 0,
      total: 15100.5,
    });
  });
});

describe('toKobo (Paystack smallest unit)', () => {
  it('converts naira to kobo', () => {
    expect(toKobo(17100.5)).toBe(1710050);
  });

  it('rounds fractional kobo', () => {
    expect(toKobo('1999.995')).toBe(200000);
  });
});

describe('formatNaira', () => {
  it('formats with naira sign and thousands separator', () => {
    expect(formatNaira(17100.5)).toBe('₦17,101');
    expect(formatNaira('4500.00')).toBe('₦4,500');
  });
});
