import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const rideInclude = {
  customer: true,
  assignment: { include: { driver: true, vehicle: true } },
  statusHistory: { orderBy: { changedAt: 'desc' as const }, take: 5 },
};

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  // Admin: all rides
  findAll(status?: string) {
    return this.prisma.rideRequest.findMany({
      where: status ? { status } : undefined,
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Customer: own rides
  findByCustomer(userId: number) {
    return this.prisma.rideRequest.findMany({
      where: { customer: { userId } },
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Driver: assigned rides
  findByDriver(userId: number) {
    return this.prisma.rideRequest.findMany({
      where: { assignment: { driver: { userId } } },
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const ride = await this.prisma.rideRequest.findUnique({ where: { id }, include: rideInclude });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async create(userId: number, data: { pickupLocation: string; dropLocation: string; scheduledDate: string; scheduledTime: string; passengers: number; purpose?: string; remarks?: string }) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Customer profile not found');
    const ride = await this.prisma.rideRequest.create({
      data: { customerId: customer.id, ...data, scheduledDate: new Date(data.scheduledDate) },
      include: rideInclude,
    });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: ride.id, status: 'PENDING', changedBy: userId } });
    return ride;
  }

  async updateStatus(id: number, status: string, userId: number) {
    const ride = await this.prisma.rideRequest.update({ where: { id }, data: { status }, include: rideInclude });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status, changedBy: userId } });
    return ride;
  }

  async assign(id: number, driverId: number, vehicleId: number, userId: number) {
    const existing = await this.prisma.rideAssignment.findUnique({ where: { rideRequestId: id } });
    if (existing) {
      await this.prisma.rideAssignment.update({ where: { rideRequestId: id }, data: { driverId, vehicleId } });
    } else {
      await this.prisma.rideAssignment.create({ data: { rideRequestId: id, driverId, vehicleId } });
    }
    await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_RIDE' } });
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ON_RIDE' } });
    return this.updateStatus(id, 'ASSIGNED', userId);
  }

  async startRide(id: number, userId: number) {
    await this.prisma.rideAssignment.update({ where: { rideRequestId: id }, data: { startedAt: new Date() } });
    return this.updateStatus(id, 'IN_PROGRESS', userId);
  }

  async completeRide(id: number, userId: number) {
    const ride = await this.findOne(id);
    await this.prisma.rideAssignment.update({ where: { rideRequestId: id }, data: { completedAt: new Date() } });
    if (ride.assignment) {
      await this.prisma.vehicle.update({ where: { id: ride.assignment.vehicleId }, data: { status: 'AVAILABLE' } });
      await this.prisma.driver.update({ where: { id: ride.assignment.driverId }, data: { status: 'AVAILABLE' } });
    }
    return this.updateStatus(id, 'COMPLETED', userId);
  }

  // Available rides for sharing (same pickup area)
  findAvailableNearby(pickupLocation: string) {
    return this.prisma.rideRequest.findMany({
      where: {
        status: { in: ['APPROVED', 'ASSIGNED'] },
        pickupLocation: { contains: pickupLocation.split(' ')[0] },
      },
      include: { assignment: { include: { driver: true, vehicle: true } } },
    });
  }
}
