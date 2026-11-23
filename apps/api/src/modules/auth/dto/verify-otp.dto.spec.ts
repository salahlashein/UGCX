import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';

const errorsFor = (body: Record<string, unknown>) =>
  validateSync(plainToInstance(VerifyOtpDto, body)).map((e) => e.property);

describe('VerifyOtpDto role', () => {
  it.each(['brand', 'creator'])('accepts self sign-up as %s', (role) => {
    expect(errorsFor({ email: 'a@example.com', otp: '123456', role })).toEqual(
      [],
    );
  });

  it('rejects self sign-up as admin', () => {
    expect(
      errorsFor({ email: 'a@example.com', otp: '123456', role: 'admin' }),
    ).toEqual(['role']);
  });
});
