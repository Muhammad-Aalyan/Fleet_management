import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalDrivers, totalVehicles, totalCustomers, totalRequests, pending, active, completed, fuelLogs] =
      await Promise.all([
        this.prisma.driver.count(),
        this.prisma.vehicle.count(),
        this.prisma.customer.count(),
        this.prisma.rideRequest.count(),
        this.prisma.rideRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.rideRequest.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.rideRequest.count({ where: { status: 'COMPLETED' } }),
        this.prisma.fuelLog.aggregate({ _sum: { amount: true } }),
      ]);

    const vehicleStats = await Promise.all([
      this.prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.vehicle.count({ where: { status: 'IN_RIDE' } }),
      this.prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
    ]);

    return {
      totalDrivers, totalVehicles, totalCustomers, totalRequests,
      pendingRequests: pending, activeRides: active, completedRides: completed,
      totalFuelCost: fuelLogs._sum.amount ?? 0,
      vehicleStats: { available: vehicleStats[0], inRide: vehicleStats[1], maintenance: vehicleStats[2] },
    };
  }

  async getRecentRequests() {
    return this.prisma.rideRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, assignment: { include: { driver: true, vehicle: true } } },
    });
  }
}
