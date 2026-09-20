import { describe, expect, it } from 'vitest';
import { deliveryAddressLines, formatOrderDateTime } from '../shared/utils/orderDisplay';

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
