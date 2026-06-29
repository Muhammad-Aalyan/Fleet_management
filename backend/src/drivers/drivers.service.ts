import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({
      include: { user: { select: { email: true, isActive: true } }, vehicle: true },
    });
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: { user: { select: { email: true } }, vehicle: true },
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

  update(id: number, data: { name?: string; phone?: string; cnic?: string; licenseNumber?: string; licenseExpiry?: Date; status?: string; vehicleId?: number }) {
    return this.prisma.driver.update({ where: { id }, data });
  }
}
