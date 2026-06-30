import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.mileageLog.findMany({
      include: { driver: true, rideRequest: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');

    const logs = await this.prisma.mileageLog.findMany({
      where: { driverId: driver.id },
      include: { rideRequest: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(logs.map(async (log) => {
      const base = log.rideRequest;
      if (!base) return { ...log, customers: [], pickupLocation: null, dropLocation: null, scheduledDate: null };

      // Find all rides on same route+schedule+driver to collect all customer names (shared ride)
      const sharedRides = await this.prisma.rideRequest.findMany({
        where: {
          pickupLocation: base.pickupLocation,
          dropLocation: base.dropLocation,
          scheduledDate: base.scheduledDate,
          scheduledTime: base.scheduledTime,
          assignment: { driverId: driver.id },
        },
        include: { customer: true },
      });

      return {
        ...log,
        pickupLocation: base.pickupLocation,
        dropLocation: base.dropLocation,
        scheduledDate: base.scheduledDate,
        customers: sharedRides.map(r => ({ name: r.customer.name, passengers: r.passengers })),
      };
    }));

    return enriched;
  }

  async findByRideId(rideRequestId: number, userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.mileageLog.findFirst({ where: { rideRequestId, driverId: driver.id } });
  }

  async create(userId: number, data: { startMileage: number; endMileage: number; photoUrl?: string; rideRequestId?: number }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.mileageLog.create({ data: { driverId: driver.id, vehicleId: driver.vehicleId, ...data } });
  }

  async updateEnd(id: number, userId: number, endMileage: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    const log = await this.prisma.mileageLog.findFirst({ where: { id, driverId: driver.id } });
    if (!log) throw new NotFoundException('Mileage log not found');
    return this.prisma.mileageLog.update({ where: { id }, data: { endMileage } });
  }
}
