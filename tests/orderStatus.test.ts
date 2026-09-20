import { describe, expect, it } from 'vitest';
import { ADMIN_EDITABLE_PAYMENT_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES, canTransitionOrder, legalNextStatuses } from '../shared/utils/orderStatus';

describe('status enums (Batch 5 contract)', () => {
  it('matches the statuses enforced by the admin API', () => {
    expect([...ORDER_STATUSES]).toEqual([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'completed',
      'cancelled',
    ]);
    expect([...PAYMENT_STATUSES]).toEqual(['pending', 'paid', 'failed', 'refunded']);
  });
});

describe('canTransitionOrder', () => {
  it('allows each forward step of the kitchen pipeline', () => {
    expect(canTransitionOrder('pending', 'confirmed')).toBe(true);
    expect(canTransitionOrder('confirmed', 'preparing')).toBe(true);
    expect(canTransitionOrder('preparing', 'ready')).toBe(true);
    expect(canTransitionOrder('ready', 'completed')).toBe(true);
  });

  it('rejects skipping steps', () => {
    expect(canTransitionOrder('pending', 'ready')).toBe(false);
    expect(canTransitionOrder('pending', 'completed')).toBe(false);
    expect(canTransitionOrder('confirmed', 'completed')).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(canTransitionOrder('ready', 'preparing')).toBe(false);
    expect(canTransitionOrder('completed', 'ready')).toBe(false);
  });

  it('allows cancelling any active order', () => {
    for (const from of ['pending', 'confirmed', 'preparing', 'ready'] as const) {
      expect(canTransitionOrder(from, 'cancelled')).toBe(true);
    }
  });

  it('treats completed and cancelled as terminal', () => {
    expect(canTransitionOrder('completed', 'cancelled')).toBe(false);
    expect(canTransitionOrder('cancelled', 'pending')).toBe(false);
    expect(canTransitionOrder('cancelled', 'confirmed')).toBe(false);
  });

  it('allows re-saving the current status (idempotent)', () => {
    for (const s of ORDER_STATUSES) {
      expect(canTransitionOrder(s, s)).toBe(true);
    }
  });
});

describe('legalNextStatuses (admin dropdown source)', () => {
  it('returns exactly the transitions canTransitionOrder allows', () => {
    for (const from of ORDER_STATUSES) {
      const expected = ORDER_STATUSES.filter((to) => canTransitionOrder(from, to));
      expect([...legalNextStatuses(from)].sort()).toEqual([...expected].sort());
    }
  });

  it('always includes the current status (re-save is legal)', () => {
    for (const s of ORDER_STATUSES) {
      expect(legalNextStatuses(s)).toContain(s);
    }
  });

  it('offers no escape from terminal states', () => {
    expect(legalNextStatuses('completed')).toEqual(['completed']);
    expect(legalNextStatuses('cancelled')).toEqual(['cancelled']);
  });
});

describe('ADMIN_EDITABLE_PAYMENT_STATUSES (paid is webhook-only)', () => {
  it('excludes paid but keeps every other payment state', () => {
    expect([...ADMIN_EDITABLE_PAYMENT_STATUSES].sort()).toEqual(
      [...PAYMENT_STATUSES].filter((s) => s !== 'paid').sort(),
    );
    expect(ADMIN_EDITABLE_PAYMENT_STATUSES).not.toContain('paid');
  });
});
