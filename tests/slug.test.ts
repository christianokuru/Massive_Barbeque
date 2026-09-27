import { describe, expect, it } from 'vitest';
import { slugify } from '../shared/utils/slug';

describe('slugify', () => {
  it('lowercases and dasherizes', () => {
    expect(slugify('Catfish BBQ')).toBe('catfish-bbq');
    expect(slugify('  Couple   Pack  ')).toBe('couple-pack');
  });

  it('strips punctuation and collapses dashes', () => {
    expect(slugify("Catfish Pps - ₦9,000!")).toBe('catfish-pps-9000');
    // Underscores are stripped (not dasherized) — matches legacy behavior.
    expect(slugify('a--b__c')).toBe('a-bc');
  });

  it('handles empty input', () => {
    expect(slugify('')).toBe('');
  });
});
