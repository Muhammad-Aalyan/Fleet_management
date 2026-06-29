import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.fuelLog.findMany({ include: { driver: true }, orderBy: { createdAt: 'desc' } }); }

  async findByDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.fuelLog.findMany({ where: { driverId: driver.id }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: number, data: { liters: number; amount: number; currentMileage: number; receiptPhotoUrl?: string }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.fuelLog.create({ data: { driverId: driver.id, vehicleId: driver.vehicleId, ...data } });
  }
}
