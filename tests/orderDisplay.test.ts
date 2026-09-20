import { describe, expect, it } from 'vitest';
import { deliveryAddressLines, filterOrderRows, formatOrderDateTime, needsAttentionRows } from '../shared/utils/orderDisplay';

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
