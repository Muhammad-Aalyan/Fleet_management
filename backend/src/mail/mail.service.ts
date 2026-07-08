import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Client, SendEmailV3_1 } from 'node-mailjet';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client = new Client({
    apiKey: process.env.MJ_APIKEY_PUBLIC,
    apiSecret: process.env.MJ_APIKEY_PRIVATE,
  });

  async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
    const data: SendEmailV3_1.Body = {
      Messages: [
        {
          From: {
            Email: process.env.MAIL_FROM_EMAIL ?? 'muhammad.aalyan002@gmail.com',
            Name: process.env.MAIL_FROM_NAME ?? 'Ride On',
          },
          To: [{ Email: to, Name: name || to }],
          Subject: 'Your Ride On verification code',
          TextPart: `Hi ${name || ''},\n\nYour verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`,
          HTMLPart: `
            <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;">
              <h2 style="color:#0C0D10;">Ride On</h2>
              <p>Hi ${name || ''},</p>
              <p>Your verification code is:</p>
              <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#E01E2B;margin:16px 0;">${otp}</div>
              <p style="color:#6A6D76;font-size:13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        },
      ],
    };

    try {
      await this.client.post('send', { version: 'v3.1' }).request(data);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}: ${(err as Error).message}`, err as Error);
      throw new InternalServerErrorException('Unable to send verification email right now. Please try again in a few minutes.');
    }
  }
}
