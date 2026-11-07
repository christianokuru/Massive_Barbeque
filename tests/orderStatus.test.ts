import { describe, expect, it } from 'vitest';
import { ADMIN_EDITABLE_PAYMENT_STATUSES, canAdminSetPaymentStatus, canStartPayment, ATTENTION_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES, canTransitionOrder, canUserCancelOrder, isTerminalOrderStatus, legalNextStatuses, planBulkStatusChange } from '../shared/utils/orderStatus';

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

describe('ADMIN_EDITABLE_PAYMENT_STATUSES (money states are provider-only)', () => {
  it('excludes paid and refunded', () => {
    expect([...ADMIN_EDITABLE_PAYMENT_STATUSES].sort()).toEqual(
      [...PAYMENT_STATUSES].filter((s) => s !== 'paid' && s !== 'refunded').sort(),
    );
  });
});

describe('canAdminSetPaymentStatus', () => {
  it('lets unpaid orders move between pending and failed', () => {
    expect(canAdminSetPaymentStatus('pending', 'failed').ok).toBe(true);
    expect(canAdminSetPaymentStatus('failed', 'pending').ok).toBe(true);
  });
  it('never lets an admin mint paid or refunded', () => {
    expect(canAdminSetPaymentStatus('pending', 'paid').ok).toBe(false);
    expect(canAdminSetPaymentStatus('pending', 'refunded').ok).toBe(false);
  });
  it('locks paid and refunded orders', () => {
    expect(canAdminSetPaymentStatus('paid', 'pending').ok).toBe(false);
    expect(canAdminSetPaymentStatus('paid', 'failed').ok).toBe(false);
    expect(canAdminSetPaymentStatus('paid', 'refunded').ok).toBe(false);
    expect(canAdminSetPaymentStatus('refunded', 'pending').ok).toBe(false);
  });
  it('treats re-sending the current value as a no-op', () => {
    expect(canAdminSetPaymentStatus('paid', 'paid').ok).toBe(true);
  });
});

describe('canStartPayment', () => {
  it('allows unpaid live orders', () => {
    expect(canStartPayment('pending', 'pending').ok).toBe(true);
    expect(canStartPayment('confirmed', 'failed').ok).toBe(true);
  });
  it('blocks paid, refunded, cancelled and completed orders', () => {
    expect(canStartPayment('confirmed', 'paid').ok).toBe(false);
    expect(canStartPayment('cancelled', 'refunded').ok).toBe(false);
    expect(canStartPayment('cancelled', 'pending').ok).toBe(false);
    expect(canStartPayment('completed', 'pending').ok).toBe(false);
  });
});

describe('planBulkStatusChange', () => {
  const rows = [
    { id: 'a', status: 'pending' },
    { id: 'b', status: 'confirmed' },
    { id: 'c', status: 'completed' },
  ];

  it('applies legal moves and skips the rest', () => {
    expect(planBulkStatusChange(rows, 'cancelled')).toEqual({
      apply: ['a', 'b'],
      skipped: ['c'],
    });
  });

  it('treats re-saving the current state as applicable', () => {
    expect(planBulkStatusChange(rows, 'pending')).toEqual({
      apply: ['a'],
      skipped: ['b', 'c'],
    });
  });

  it('handles empty input', () => {
    expect(planBulkStatusChange([], 'confirmed')).toEqual({ apply: [], skipped: [] });
  });
});

describe('ATTENTION_STATUSES', () => {
  it('covers every non-terminal state and nothing terminal', () => {
    expect([...ATTENTION_STATUSES].sort()).toEqual(
      [...ORDER_STATUSES].filter((s) => s !== 'completed' && s !== 'cancelled').sort(),
    );
  });
});

describe('isTerminalOrderStatus', () => {
  it('flags completed and cancelled only', () => {
    expect(isTerminalOrderStatus('completed')).toBe(true);
    expect(isTerminalOrderStatus('cancelled')).toBe(true);
    for (const s of ['pending', 'confirmed', 'preparing', 'ready']) {
      expect(isTerminalOrderStatus(s)).toBe(false);
    }
  });

  it('treats unknown values as non-terminal', () => {
    expect(isTerminalOrderStatus(undefined)).toBe(false);
    expect(isTerminalOrderStatus(null)).toBe(false);
    expect(isTerminalOrderStatus('refunded')).toBe(false);
  });
});

describe('canUserCancelOrder', () => {
  it('allows cancelling an unpaid pending order', () => {
    expect(canUserCancelOrder('pending', 'pending')).toEqual({ ok: true, reason: '' });
    expect(canUserCancelOrder('pending', 'failed')).toEqual({ ok: true, reason: '' });
  });

  it('refuses non-pending orders', () => {
    for (const s of ['confirmed', 'preparing', 'ready', 'completed', 'cancelled']) {
      const r = canUserCancelOrder(s, 'pending');
      expect(r.ok).toBe(false);
      expect(r.reason).toContain('pending');
    }
  });

  it('refuses paid orders (no refund path yet)', () => {
    const r = canUserCancelOrder('pending', 'paid');
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('refund');
  });
});
