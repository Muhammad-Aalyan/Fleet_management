import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  LoginDto, RegisterDto, VerifyOtpDto, ResendOtpDto,
  ForgotPasswordDto, VerifyResetOtpDto, ResetPasswordDto,
} from './dto/auth.dto';

const OTP_TTL_MINUTES = 5;
const SESSION_TTL_MINUTES = 20;
const RESET_TOKEN_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

type OtpPurpose = 'LOGIN' | 'RESET_PASSWORD';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService, private jwt: JwtService, private mail: MailService) {}

  private async getProfile(userId: number, role: string): Promise<{ name: string; phone: string } | null> {
    if (role === 'CUSTOMER') {
      return this.prisma.customer.findUnique({ where: { userId }, select: { name: true, phone: true } });
    } else if (role === 'DRIVER') {
      return this.prisma.driver.findUnique({ where: { userId }, select: { name: true, phone: true } });
    }
    return null;
  }

  private async createAndSendOtp(userId: number, email: string, name: string, purpose: OtpPurpose) {
    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.loginOtp.create({
      data: {
        userId,
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });
    try {
      await this.mail.sendOtpEmail(email, name, otp);
    } catch (err) {
      this.logger.warn(`OTP email delivery failed for ${email}, continuing anyway: ${(err as Error).message}`);
    }
  }

  private async verifyOtpRecord(userId: number, otp: string, purpose: OtpPurpose) {
    const record = await this.prisma.loginOtp.findFirst({
      where: { userId, purpose, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException('No pending verification code. Please start again.');
    if (record.expiresAt < new Date()) throw new BadRequestException('Verification code expired. Please request a new one.');
    if (record.attempts >= MAX_OTP_ATTEMPTS) throw new BadRequestException('Too many incorrect attempts. Please request a new code.');

    const matches = otp === record.otp;
    if (!matches) {
      await this.prisma.loginOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.loginOtp.update({ where: { id: record.id }, data: { verified: true } });
    return record;
  }

  private async resendOtpFor(userId: number, purpose: OtpPurpose) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Account is inactive');

    const last = await this.prisma.loginOtp.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (last && last.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_SECONDS * 1000) {
      throw new HttpException('Please wait before requesting another code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const profile = await this.getProfile(user.id, user.role);
    await this.createAndSendOtp(user.id, user.email, profile?.name ?? 'there', purpose);

    return { message: 'A new code has been sent to your email.' };
  }

  private async issueSession(user: { id: number; email: string; role: string }) {
    const sessionId = randomUUID();
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MINUTES * 60_000),
      },
    });
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role, sessionId });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const profile = await this.getProfile(user.id, user.role);
    await this.createAndSendOtp(user.id, user.email, profile?.name ?? 'there', 'LOGIN');

    return { otpRequired: true, userId: user.id, email: user.email };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.verifyOtpRecord(dto.userId, dto.otp, 'LOGIN');

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Account is inactive');

    const profile = await this.getProfile(user.id, user.role);
    const token = await this.issueSession(user);

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, name: profile?.name ?? 'Admin', phone: profile?.phone ?? '' },
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    return this.resendOtpFor(dto.userId, 'LOGIN');
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, role: dto.role },
    });

    if (dto.role === 'CUSTOMER') {
      await this.prisma.customer.create({ data: { userId: user.id, name: dto.name, phone: dto.phone } });
    } else if (dto.role === 'DRIVER') {
      await this.prisma.driver.create({
        data: {
          userId: user.id, name: dto.name, phone: dto.phone,
          cnic: 'PENDING', licenseNumber: 'PENDING', licenseExpiry: new Date('2099-12-31'),
        },
      });
    }

    const token = await this.issueSession(user);
    return { token, user: { id: user.id, email: user.email, role: user.role, name: dto.name } };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, customer: { select: { name: true, phone: true } }, driver: { select: { name: true, phone: true } } },
    });
    return user;
  }

  async logout(sessionId: string) {
    await this.prisma.userSession.updateMany({ where: { sessionId }, data: { revoked: true } });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('No account found with this email');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const profile = await this.getProfile(user.id, user.role);
    await this.createAndSendOtp(user.id, user.email, profile?.name ?? 'there', 'RESET_PASSWORD');

    return { userId: user.id, email: user.email };
  }

  async resendForgotPasswordOtp(dto: ResendOtpDto) {
    return this.resendOtpFor(dto.userId, 'RESET_PASSWORD');
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    await this.verifyOtpRecord(dto.userId, dto.otp, 'RESET_PASSWORD');

    const resetToken = randomUUID();
    await this.prisma.passwordReset.create({
      data: {
        userId: dto.userId,
        token: resetToken,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    });

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordReset.findUnique({ where: { token: dto.resetToken } });
    if (!record || record.userId !== dto.userId || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link has expired. Please start again.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: dto.userId }, data: { password: hashed } }),
      this.prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.userSession.updateMany({ where: { userId: dto.userId, revoked: false }, data: { revoked: true } }),
    ]);

    return { message: 'Password updated successfully. Please sign in with your new password.' };
  }
}
