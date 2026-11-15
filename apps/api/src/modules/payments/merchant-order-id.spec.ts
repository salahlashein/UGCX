import {
  decodeMerchantOrderId,
  encodeMerchantOrderId,
} from './merchant-order-id';

describe('merchant-order-id', () => {
  it('1. encodeMerchantOrderId("campaign_escrow", "abc") returns cmp_abc', () => {
    expect(encodeMerchantOrderId('campaign_escrow', 'abc')).toBe('cmp_abc');
  });

  it('2. decodeMerchantOrderId("cmp_abc") returns the campaign intent and abc', () => {
    expect(decodeMerchantOrderId('cmp_abc')).toEqual({
      intent: 'campaign_escrow',
      id: 'abc',
    });
  });

  it('3. decodeMerchantOrderId("col_abc") returns the top up intent and abc', () => {
    expect(decodeMerchantOrderId('col_abc')).toEqual({
      intent: 'collaboration_topup',
      id: 'abc',
    });
  });

  it('4. a bare UUID decodes as a top up, for backward compatibility', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(decodeMerchantOrderId(uuid)).toEqual({
      intent: 'collaboration_topup',
      id: uuid,
    });
  });

  it('5. an unknown prefix returns null', () => {
    expect(decodeMerchantOrderId('xyz_123')).toBeNull();
    expect(decodeMerchantOrderId('some-random-string')).toBeNull();
  });
});
