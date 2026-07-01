import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const rows = await this.prisma.$queryRaw<any[]>`SELECT * FROM dbo.vw_DashboardStats`;
    const s = rows[0] ?? {};
    const total = (s.vehiclesAvailable ?? 0) + (s.vehiclesInRide ?? 0) + (s.vehiclesMaintenance ?? 0) + (s.vehiclesInactive ?? 0);
    return {
      totalDrivers:     s.totalDrivers     ?? 0,
      totalVehicles:    s.totalVehicles    ?? 0,
      pendingRequests:  s.pendingRequests  ?? 0,
      activeRides:      s.activeRides      ?? 0,
      completedToday:   s.completedToday   ?? 0,
      totalCustomers:   s.totalCustomers   ?? 0,
      totalRequests:    s.totalRequests    ?? 0,
      totalFuelCost:    s.totalFuelCost    ?? 0,
      vehicleUtilization: {
        available:   total > 0 ? Math.round(((s.vehiclesAvailable   ?? 0) / total) * 100) : 0,
        inRide:      total > 0 ? Math.round(((s.vehiclesInRide      ?? 0) / total) * 100) : 0,
        maintenance: total > 0 ? Math.round(((s.vehiclesMaintenance ?? 0) / total) * 100) : 0,
        inactive:    total > 0 ? Math.round(((s.vehiclesInactive    ?? 0) / total) * 100) : 0,
      },
      driverStatus: {
        available: s.driversAvailable ?? 0,
        onRide:    s.driversOnRide    ?? 0,
        offDuty:   s.driversOffDuty   ?? 0,
      },
    };
  }

  async getRecentRequests() {
    return this.prisma.$queryRaw<any[]>`SELECT * FROM dbo.vw_RecentRideRequests`;
  }

  async getActiveRides() {
    return this.prisma.$queryRaw<any[]>`SELECT * FROM dbo.vw_ActiveRides`;
  }

  async getCustomers() {
    return this.prisma.$queryRaw<any[]>`SELECT * FROM dbo.vw_Customers ORDER BY joinedAt DESC`;
  }
}
