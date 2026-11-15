import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host =
      this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(
      this.configService.get<string>('SMTP_PORT') || '587',
      10,
    );
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const nodeEnv =
      this.configService.get<string>('nodeEnv') ||
      process.env.NODE_ENV ||
      'development';

    if (nodeEnv === 'production' && (!user || !pass)) {
      throw new Error('SMTP credentials are required in production');
    }

    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      (user ? `UGCX <${user}>` : 'UGCX <no-reply@ugcx.com>');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log(
        `SMTP Mailer initialized via ${host}:${port} for ${user}`,
      );
    } else {
      this.logger.warn(
        'SMTP credentials not configured; emails will be logged locally only',
      );
    }
  }

  /**
   * Sends a 6-digit verification code to the recipient.
   */
  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const subject = `Your UGCX Verification Code: ${otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #eff2ed; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #dce4dd; text-align: center;">
          <h1 style="color: #2f5d46; font-size: 26px; margin: 0 0 16px; font-weight: 500; letter-spacing: -0.5px;">UGCX</h1>
          <p style="color: #171d19; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
            Here is your verification code to sign in to your UGCX account:
          </p>
          <div style="display: inline-block; background-color: #e1ebe4; color: #2f5d46; font-size: 32px; font-weight: 500; letter-spacing: 8px; padding: 16px 28px; border-radius: 8px; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #727a74; font-size: 14px; margin: 0;">
            This 6-digit code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[LOCAL DEV EMAIL] To: ${to} | OTP: ${otp}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: `Your UGCX verification code is: ${otp}`,
      });
      this.logger.log(`Sent verification email to ${to}`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      return false;
    }
  }
}
