import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({
      include: { user: { select: { email: true, isActive: true } }, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: { user: { select: { email: true, isActive: true } }, vehicle: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async findByUserId(userId: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true },
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async create(data: {
    email: string; password: string; name: string; phone: string;
    cnic: string; licenseNumber: string; licenseExpiry: string; vehicleId?: number;
  }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hashed, role: 'DRIVER' },
    });

    const driver = await this.prisma.driver.create({
      data: {
        userId: user.id,
        name: data.name,
        phone: data.phone,
        cnic: data.cnic,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        vehicleId: data.vehicleId ?? null,
      },
      include: { user: { select: { email: true, isActive: true } }, vehicle: true },
    });

    return driver;
  }

  update(id: number, data: {
    name?: string; phone?: string; cnic?: string;
    licenseNumber?: string; licenseExpiry?: Date; status?: string; vehicleId?: number;
  }) {
    return this.prisma.driver.update({
      where: { id }, data,
      include: { user: { select: { email: true, isActive: true } }, vehicle: true },
    });
  }
}
