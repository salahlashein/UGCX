import { usesMockPayments } from './mock-payments';

describe('usesMockPayments', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it.each([
    ['development', true],
    ['production', false],
    ['staging', false],
    ['test', false],
  ])('NODE_ENV=%s returns %s', (env, expected) => {
    process.env.NODE_ENV = env;
    expect(usesMockPayments()).toBe(expected);
  });

  it('treats an unset NODE_ENV as development, like the app config does', () => {
    delete process.env.NODE_ENV;
    expect(usesMockPayments()).toBe(true);
  });
});
