import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });

    let profile: { id: number; name: string; phone: string } | null = null;
    if (user.role === 'CUSTOMER') {
      profile = await this.prisma.customer.findUnique({ where: { userId: user.id }, select: { id: true, name: true, phone: true } });
    } else if (user.role === 'DRIVER') {
      profile = await this.prisma.driver.findUnique({ where: { userId: user.id }, select: { id: true, name: true, phone: true } });
    }

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, name: profile?.name ?? 'Admin', phone: profile?.phone ?? '' },
    };
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

    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, role: user.role, name: dto.name } };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, customer: { select: { name: true, phone: true } }, driver: { select: { name: true, phone: true } } },
    });
    return user;
  }
}
