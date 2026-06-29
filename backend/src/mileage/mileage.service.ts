import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.mileageLog.findMany({ include: { driver: true }, orderBy: { createdAt: 'desc' } }); }

  async findByDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.mileageLog.findMany({ where: { driverId: driver.id }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: number, data: { startMileage: number; endMileage: number; photoUrl?: string; rideRequestId?: number }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.mileageLog.create({ data: { driverId: driver.id, vehicleId: driver.vehicleId, ...data } });
  }
}
