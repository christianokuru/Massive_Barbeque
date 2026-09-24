import { describe, expect, it } from 'vitest';
import { assertGatewayUrl } from '../shared/utils/payments';

describe('assertGatewayUrl', () => {
  it('allows the known gateway hosts', () => {
    expect(assertGatewayUrl('https://checkout.paystack.com/tx/abc')).toBe(
      'https://checkout.paystack.com/tx/abc',
    );
    expect(assertGatewayUrl('https://checkout.flutterwave.com/pay/xyz')).toBe(
      'https://checkout.flutterwave.com/pay/xyz',
    );
  });

  it('rejects off-domain and malformed URLs', () => {
    expect(() => assertGatewayUrl('https://evil.com/pay')).toThrow('bad-gateway-url');
    expect(() => assertGatewayUrl('https://checkout.paystack.com.evil.com/')).toThrow(
      'bad-gateway-url',
    );
    expect(() => assertGatewayUrl('not a url')).toThrow('bad-gateway-url');
    expect(() => assertGatewayUrl('javascript:alert(1)')).toThrow('bad-gateway-url');
  });
});
