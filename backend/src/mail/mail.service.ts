import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
    const relayUrl = process.env.MAIL_RELAY_URL;
    const relaySecret = process.env.MAIL_RELAY_SECRET;

    if (!relayUrl || !relaySecret) {
      this.logger.error('MAIL_RELAY_URL / MAIL_RELAY_SECRET not configured');
      throw new InternalServerErrorException('Unable to send verification email right now. Please try again in a few minutes.');
    }

    const body = {
      to,
      subject: 'Your Ride On verification code',
      text: `Hi ${name || ''},\n\nYour verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;">
          <h2 style="color:#0C0D10;">Ride On</h2>
          <p>Hi ${name || ''},</p>
          <p>Your verification code is:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#E01E2B;margin:16px 0;">${otp}</div>
          <p style="color:#6A6D76;font-size:13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      fromName: process.env.MAIL_FROM_NAME ?? 'Ride On',
    };

    try {
      const res = await fetch(`${relayUrl.replace(/\/$/, '')}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-relay-secret': relaySecret },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Relay responded ${res.status}: ${errText}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}: ${(err as Error).message}`, err as Error);
      throw new InternalServerErrorException('Unable to send verification email right now. Please try again in a few minutes.');
    }
  }
}
