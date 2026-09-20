import { describe, expect, it } from 'vitest';
import { buildRevenueSeries, deliveryAddressLines, filterOrderRows, formatOrderDateTime, needsAttentionRows, revenueDeltaFor, toOrderRow } from '../shared/utils/orderDisplay';

describe('deliveryAddressLines', () => {
  it('renders a full snake_case address in order', () => {
    expect(
      deliveryAddressLines({
        first_name: 'Ada',
        last_name: 'Obi',
        phone: '0803 000 0000',
        address_line_1: '12 Grill Close',
        address_line_2: 'Off Smoke Road',
        city: 'Lagos',
        state: 'Lagos',
        postal_code: '100001',
      }),
    ).toEqual([
      'Ada Obi',
      '12 Grill Close',
      'Off Smoke Road',
      'Lagos, Lagos',
      '0803 000 0000',
    ]);
  });

  it('skips missing/blank parts without leaving gaps', () => {
    expect(
      deliveryAddressLines({
        first_name: 'Ada',
        last_name: '',
        address_line_1: '12 Grill Close',
        address_line_2: null,
        city: 'Lagos',
        state: '',
        phone: '  ',
      }),
    ).toEqual(['Ada', '12 Grill Close', 'Lagos']);
  });

  it('returns [] for null, undefined, or non-objects', () => {
    expect(deliveryAddressLines(null)).toEqual([]);
    expect(deliveryAddressLines(undefined)).toEqual([]);
    expect(deliveryAddressLines('12 Grill Close')).toEqual([]);
  });
});

describe('formatOrderDateTime', () => {
  it('formats an ISO timestamp', () => {
    const out = formatOrderDateTime('2026-09-16T01:08:07.040041+00:00');
    expect(out).not.toBe('—');
    expect(out).toContain('16');
    expect(out).toContain('Sept');
  });

  it('returns an em dash for missing or invalid input', () => {
    expect(formatOrderDateTime(null)).toBe('—');
    expect(formatOrderDateTime(undefined)).toBe('—');
    expect(formatOrderDateTime('not-a-date')).toBe('—');
  });
});

describe('filterOrderRows', () => {
  const rows = [
    { orderNumber: 'MB20884485', customerName: 'Ada Obi', customerEmail: 'ada@example.com' },
    { orderNumber: 'MB20884486', customerName: 'Tunde', customerEmail: 'tunde@example.com' },
  ];

  it('returns everything on blank query', () => {
    expect(filterOrderRows(rows, '  ')).toEqual(rows);
  });

  it('matches order number, name, and email case-insensitively', () => {
    expect(filterOrderRows(rows, 'mb20884485')).toHaveLength(1);
    expect(filterOrderRows(rows, 'ADA')).toHaveLength(1);
    expect(filterOrderRows(rows, 'tunde@example')).toHaveLength(1);
  });

  it('returns [] when nothing matches', () => {
    expect(filterOrderRows(rows, 'zzz')).toEqual([]);
  });
});

describe('needsAttentionRows', () => {
  const rows = [
    { id: 'a', status: 'pending' },
    { id: 'b', status: 'preparing' },
    { id: 'c', status: 'completed' },
    { id: 'd', status: 'cancelled' },
    { id: 'e', status: 'ready' },
  ];
  const statuses = ['pending', 'confirmed', 'preparing', 'ready'];

  it('keeps actionable orders and drops terminal ones', () => {
    expect(needsAttentionRows(rows, statuses).map((r) => r.id)).toEqual(['a', 'b', 'e']);
  });

  it('caps the queue at the limit', () => {
    expect(needsAttentionRows(rows, statuses, 2).map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('toOrderRow', () => {
  it('maps a full order', () => {
    expect(
      toOrderRow({
        id: 'abc12345-uuid',
        orderNumber: 'MB20884485',
        customerName: 'Ada Obi',
        customerEmail: 'ada@example.com',
        items: [{ quantity: 2 }, { quantity: 1 }],
        total: '15000.00',
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2026-09-16T01:08:07Z',
      }),
    ).toEqual({
      id: 'abc12345-uuid',
      orderNumber: 'MB20884485',
      customerName: 'Ada Obi',
      customerEmail: 'ada@example.com',
      itemCount: 3,
      total: 15000,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: '2026-09-16T01:08:07Z',
    });
  });

  it('falls back safely on missing data', () => {
    expect(toOrderRow({ id: 'x' })).toMatchObject({
      id: 'x',
      customerName: 'Guest',
      customerEmail: '',
      itemCount: 0,
      total: 0,
      status: 'pending',
      paymentStatus: 'pending',
    });
  });
});

describe('revenueDeltaFor', () => {
  const now = new Date('2026-09-20T12:00:00Z').getTime();
  const day = 24 * 60 * 60 * 1000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const paid = (total: number, at: number) => ({ paymentStatus: 'paid', total, createdAt: iso(at) });

  it('compares this week against last week', () => {
    const orders = [paid(110, now - day), paid(100, now - 8 * day)];
    expect(revenueDeltaFor(orders, now)).toBe(10);
  });

  it('returns null with no baseline week', () => {
    expect(revenueDeltaFor([paid(50, now - day)], now)).toBe(null);
  });

  it('ignores unpaid and dateless rows', () => {
    const orders = [
      { paymentStatus: 'pending', total: 99999, createdAt: iso(now - day) },
      paid(100, now - day),
      paid(100, now - 8 * day),
    ];
    expect(revenueDeltaFor(orders, now)).toBe(0);
  });
});

describe('buildRevenueSeries', () => {
  it('groups paid revenue by UTC day, oldest first', () => {
    const series = buildRevenueSeries([
      { paymentStatus: 'paid', total: '5000.00', createdAt: '2026-09-16T23:00:00Z' },
      { paymentStatus: 'paid', total: 3000, createdAt: '2026-09-15T01:00:00Z' },
      { paymentStatus: 'pending', total: 99999, createdAt: '2026-09-15T02:00:00Z' },
    ]);
    expect(series).toEqual([
      { date: '2026-09-15', revenue: 3000 },
      { date: '2026-09-16', revenue: 5000 },
    ]);
  });
});
