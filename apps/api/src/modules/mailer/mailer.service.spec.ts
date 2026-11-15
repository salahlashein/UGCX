import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

describe('MailerService', () => {
  it('throws in production when SMTP credentials are missing', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'nodeEnv') return 'production';
        if (key === 'SMTP_USER') return '';
        if (key === 'SMTP_PASS') return '';
        return null;
      }),
    } as unknown as ConfigService;

    expect(() => new MailerService(configService)).toThrow(
      'SMTP credentials are required in production',
    );
  });

  it('builds a transporter in production when credentials are provided', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'nodeEnv') return 'production';
        if (key === 'SMTP_USER') return 'user@example.com';
        if (key === 'SMTP_PASS') return 'secret';
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PORT') return '587';
        return null;
      }),
    } as unknown as ConfigService;

    const service = new MailerService(configService);
    expect(service).toBeDefined();
  });

  it('does not throw in development when credentials are empty and logs locally', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'nodeEnv') return 'development';
        if (key === 'SMTP_USER') return '';
        if (key === 'SMTP_PASS') return '';
        return null;
      }),
    } as unknown as ConfigService;

    const service = new MailerService(configService);
    expect(service).toBeDefined();
    const result = await service.sendOtpEmail('test@example.com', '123456');
    expect(result).toBe(true);
  });
});
