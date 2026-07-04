import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── Rides Report ──────────────────────────────────────────────────────────

  async getRidesReport() {
    const rides = await this.prisma.rideRequest.findMany({
      select: { id: true, status: true, scheduledDate: true, passengers: true },
      orderBy: { scheduledDate: 'asc' },
    });

    const monthMap = new Map<string, {
      month: string; total: number; completed: number; cancelled: number;
      inProgress: number; assigned: number; pending: number; approved: number;
    }>();

    for (const r of rides) {
      const d = new Date(r.scheduledDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthMap.has(key)) monthMap.set(key, { month: label, total: 0, completed: 0, cancelled: 0, inProgress: 0, assigned: 0, pending: 0, approved: 0 });
      const m = monthMap.get(key)!;
      m.total++;
      if (r.status === 'COMPLETED') m.completed++;
      else if (r.status === 'CANCELLED') m.cancelled++;
      else if (r.status === 'IN_PROGRESS') m.inProgress++;
      else if (r.status === 'ASSIGNED') m.assigned++;
      else if (r.status === 'PENDING') m.pending++;
      else if (r.status === 'APPROVED') m.approved++;
    }

    const monthly = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    const total = rides.length;
    const completed = rides.filter(r => r.status === 'COMPLETED').length;
    const cancelled = rides.filter(r => r.status === 'CANCELLED').length;

    return {
      totals: {
        total, completed, cancelled,
        inProgress: rides.filter(r => r.status === 'IN_PROGRESS').length,
        completionRate: total ? ((completed / total) * 100).toFixed(1) : '0',
        cancellationRate: total ? ((cancelled / total) * 100).toFixed(1) : '0',
        avgPassengers: total ? (rides.reduce((s, r) => s + r.passengers, 0) / total).toFixed(1) : '0',
      },
      monthly,
    };
  }

  // ─── Customer Report ────────────────────────────────────────────────────────

  async getCustomersReport() {
    const rides = await this.prisma.rideRequest.findMany({
      where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } },
      select: {
        id: true, status: true, scheduledDate: true, scheduledTime: true,
        pickupLocation: true, dropLocation: true, passengers: true, purpose: true,
        customer: { select: { name: true, phone: true } },
        assignment: {
          select: {
            driver: { select: { name: true } },
            vehicle: { select: { vehicleNumber: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    const rows = rides.map(r => ({
      id: r.id,
      customerName: r.customer.name,
      customerPhone: r.customer.phone,
      date: r.scheduledDate,
      time: r.scheduledTime,
      route: `${r.pickupLocation} → ${r.dropLocation}`,
      pickupLocation: r.pickupLocation,
      dropLocation: r.dropLocation,
      passengers: r.passengers,
      purpose: r.purpose ?? '—',
      driverName: r.assignment?.driver?.name ?? '—',
      vehicleNumber: r.assignment?.vehicle?.vehicleNumber ?? '—',
      status: r.status,
    }));

    const uniqueCustomers = new Set(rides.map(r => r.customer.name)).size;

    return {
      totals: {
        totalRides: rows.length,
        uniqueCustomers,
        completedRides: rides.filter(r => r.status === 'COMPLETED').length,
        cancelledRides: rides.filter(r => r.status === 'CANCELLED').length,
      },
      rows,
    };
  }

  // ─── Fuel Report ────────────────────────────────────────────────────────────

  async getFuelReport() {
    const logs = await this.prisma.fuelLog.findMany({
      select: {
        id: true, liters: true, amount: true, currentMileage: true, createdAt: true,
        driver: { select: { name: true } },
        vehicle: { select: { vehicleNumber: true, model: true, fuelType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const driverMap = new Map<string, { driverName: string; totalLiters: number; totalAmount: number; entries: number }>();
    for (const l of logs) {
      const k = l.driver.name;
      if (!driverMap.has(k)) driverMap.set(k, { driverName: k, totalLiters: 0, totalAmount: 0, entries: 0 });
      const d = driverMap.get(k)!;
      d.totalLiters += l.liters;
      d.totalAmount += l.amount;
      d.entries++;
    }

    const rows = logs.map(l => ({
      id: l.id,
      driverName: l.driver.name,
      vehicleNumber: l.vehicle.vehicleNumber,
      vehicleModel: l.vehicle.model,
      fuelType: l.vehicle.fuelType,
      liters: l.liters,
      amount: l.amount,
      currentMileage: l.currentMileage,
      date: l.createdAt,
    }));

    const totalLiters = logs.reduce((s, l) => s + l.liters, 0);
    const totalAmount = logs.reduce((s, l) => s + l.amount, 0);

    return {
      totals: {
        totalLiters, totalAmount, totalEntries: logs.length,
        avgCostPerLiter: totalLiters > 0 ? (totalAmount / totalLiters).toFixed(1) : '0',
      },
      rows,
      byDriver: Array.from(driverMap.values()),
    };
  }

  // ─── Driver Performance Report ─────────────────────────────────────────────

  async getDriverPerformanceReport() {
    const drivers = await this.prisma.driver.findMany({
      select: {
        id: true, name: true, status: true,
        vehicle: { select: { vehicleNumber: true, model: true } },
        rideAssignments: {
          select: {
            rideRequest: {
              select: { id: true, status: true, passengers: true, scheduledDate: true },
            },
          },
        },
        stuckAlerts: { select: { id: true, reason: true, resolved: true } },
        fuelLogs: { select: { liters: true, amount: true } },
      },
    });

    const rows = drivers.map(d => {
      const rides = d.rideAssignments.map(a => a.rideRequest);
      const total = rides.length;
      const completed = rides.filter(r => r.status === 'COMPLETED').length;
      const cancelled = rides.filter(r => r.status === 'CANCELLED').length;
      const inProgress = rides.filter(r => r.status === 'IN_PROGRESS').length;
      const assigned = rides.filter(r => r.status === 'ASSIGNED').length;
      const totalPassengers = rides.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + r.passengers, 0);
      const avgPassengers = completed > 0 ? +(totalPassengers / completed).toFixed(1) : 0;
      const completionRate = total > 0 ? +((completed / total) * 100).toFixed(1) : 0;
      const stuckTotal = d.stuckAlerts.length;
      const stuckUnresolved = d.stuckAlerts.filter(a => !a.resolved).length;
      const totalFuelCost = d.fuelLogs.reduce((s, f) => s + f.amount, 0);

      // Score: 0–100 (completion rate weighted 60%, stuck alert penalty 20%, no-cancel bonus 20%)
      const cancelPenalty = total > 0 ? (cancelled / total) * 20 : 0;
      const alertPenalty = Math.min(stuckTotal * 5, 20);
      const score = Math.max(0, Math.round(completionRate * 0.6 + 20 - cancelPenalty - alertPenalty + 20));

      return {
        id: d.id,
        name: d.name,
        status: d.status,
        vehicle: d.vehicle ? `${d.vehicle.vehicleNumber} — ${d.vehicle.model}` : '—',
        totalAssigned: total,
        completed,
        cancelled,
        inProgress,
        assigned,
        completionRate,
        avgPassengers,
        stuckAlerts: stuckTotal,
        stuckUnresolved,
        totalFuelCost,
        score: Math.min(score, 100),
      };
    });

    const totals = {
      totalDrivers: rows.length,
      avgCompletionRate: rows.length ? +(rows.reduce((s, r) => s + r.completionRate, 0) / rows.length).toFixed(1) : 0,
      totalRidesCompleted: rows.reduce((s, r) => s + r.completed, 0),
      totalAlerts: rows.reduce((s, r) => s + r.stuckAlerts, 0),
    };

    return { totals, rows: rows.sort((a, b) => b.score - a.score) };
  }

  // ─── Vehicle Utilization Report ────────────────────────────────────────────

  async getVehicleUtilizationReport() {
    const vehicles = await this.prisma.vehicle.findMany({
      select: {
        id: true, vehicleNumber: true, model: true, year: true, capacity: true,
        fuelType: true, status: true, currentMileage: true,
        rideAssignments: {
          select: {
            rideRequest: { select: { status: true, scheduledDate: true, passengers: true } },
            startedAt: true, completedAt: true,
          },
        },
        fuelLogs: { select: { liters: true, amount: true, currentMileage: true, createdAt: true } },
        maintenanceLogs: { select: { cost: true, date: true, description: true } },
      },
    });

    const mileageLogs = await this.prisma.mileageLog.findMany({
      select: { vehicleId: true, startMileage: true, endMileage: true },
    });

    const mileageByVehicle = new Map<number, number>();
    for (const m of mileageLogs) {
      if (!m.vehicleId) continue;
      const dist = m.endMileage - m.startMileage;
      if (dist > 0) mileageByVehicle.set(m.vehicleId, (mileageByVehicle.get(m.vehicleId) ?? 0) + dist);
    }

    const rows = vehicles.map(v => {
      const rides = v.rideAssignments.map(a => a.rideRequest);
      const totalRides = rides.length;
      const completedRides = rides.filter(r => r.status === 'COMPLETED').length;
      const activeRides = rides.filter(r => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length;
      const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const totalFuelCost = v.fuelLogs.reduce((s, f) => s + f.amount, 0);
      const totalKmDriven = mileageByVehicle.get(v.id) ?? 0;
      const fuelEfficiency = totalKmDriven > 0 && totalFuelLiters > 0 ? +(totalKmDriven / totalFuelLiters).toFixed(2) : 0;
      const fuelCostPerKm = totalKmDriven > 0 && totalFuelCost > 0 ? +(totalFuelCost / totalKmDriven).toFixed(1) : 0;
      const maintenanceCount = v.maintenanceLogs.length;
      const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + (m.cost ?? 0), 0);
      const lastMaintenance = v.maintenanceLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date ?? null;
      const lastFuel = v.fuelLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? null;

      return {
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        model: v.model,
        year: v.year,
        capacity: v.capacity,
        fuelType: v.fuelType,
        status: v.status,
        currentMileage: v.currentMileage,
        totalRides, completedRides, activeRides,
        totalFuelLiters, totalFuelCost,
        totalKmDriven,
        fuelEfficiency,
        fuelCostPerKm,
        maintenanceCount, maintenanceCost, lastMaintenance, lastFuel,
      };
    });

    const totals = {
      totalVehicles: rows.length,
      activeVehicles: rows.filter(r => r.status === 'IN_RIDE' || r.activeRides > 0).length,
      totalKmDriven: rows.reduce((s, r) => s + r.totalKmDriven, 0),
      totalFuelCost: rows.reduce((s, r) => s + r.totalFuelCost, 0),
      totalMaintenanceCost: rows.reduce((s, r) => s + r.maintenanceCost, 0),
    };

    return { totals, rows };
  }

  // ─── Route Analysis Report ─────────────────────────────────────────────────

  async getRouteAnalysisReport() {
    const rides = await this.prisma.rideRequest.findMany({
      select: {
        id: true, pickupLocation: true, dropLocation: true,
        passengers: true, status: true, scheduledDate: true,
      },
    });

    const routeMap = new Map<string, {
      route: string; pickupLocation: string; dropLocation: string;
      total: number; completed: number; cancelled: number; totalPassengers: number;
    }>();

    for (const r of rides) {
      const key = `${r.pickupLocation}|||${r.dropLocation}`;
      if (!routeMap.has(key)) routeMap.set(key, {
        route: `${r.pickupLocation} → ${r.dropLocation}`,
        pickupLocation: r.pickupLocation,
        dropLocation: r.dropLocation,
        total: 0, completed: 0, cancelled: 0, totalPassengers: 0,
      });
      const m = routeMap.get(key)!;
      m.total++;
      if (r.status === 'COMPLETED') { m.completed++; m.totalPassengers += r.passengers; }
      if (r.status === 'CANCELLED') m.cancelled++;
    }

    const rows = Array.from(routeMap.values())
      .map(r => ({
        ...r,
        avgPassengers: r.completed > 0 ? +(r.totalPassengers / r.completed).toFixed(1) : 0,
        cancellationRate: r.total > 0 ? +((r.cancelled / r.total) * 100).toFixed(1) : 0,
        completionRate: r.total > 0 ? +((r.completed / r.total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const uniquePickups = new Set(rides.map(r => r.pickupLocation)).size;
    const uniqueDrops = new Set(rides.map(r => r.dropLocation)).size;

    return {
      totals: {
        uniqueRoutes: rows.length,
        uniquePickups,
        uniqueDrops,
        totalRides: rides.length,
      },
      rows,
      topRoutes: rows.slice(0, 5),
    };
  }

  // ─── Reimbursements Summary ────────────────────────────────────────────────

  async getReimbursementsSummaryReport() {
    const [customerClaims, driverClaims] = await Promise.all([
      this.prisma.customerReimbursement.findMany({
        select: { id: true, amount: true, status: true, createdAt: true, purpose: true, customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.driverReimbursement.findMany({
        select: { id: true, amountPaid: true, status: true, createdAt: true, description: true, driver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const summarize = (items: { amount: number; status: string }[]) => ({
      total: items.length,
      pending: items.filter(i => i.status === 'PENDING').length,
      approved: items.filter(i => i.status === 'APPROVED').length,
      rejected: items.filter(i => i.status === 'REJECTED').length,
      totalAmount: items.reduce((s, i) => s + i.amount, 0),
      approvedAmount: items.filter(i => i.status === 'APPROVED').reduce((s, i) => s + i.amount, 0),
      pendingAmount: items.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0),
    });

    const customerAmounts = customerClaims.map(c => ({ amount: c.amount, status: c.status }));
    const driverAmounts = driverClaims.map(d => ({ amount: d.amountPaid, status: d.status }));

    const customerRows = customerClaims.map(c => ({
      id: c.id, type: 'Customer' as const,
      name: c.customer.name, purpose: c.purpose,
      amount: c.amount, status: c.status, date: c.createdAt,
    }));
    const driverRows = driverClaims.map(d => ({
      id: d.id, type: 'Driver' as const,
      name: d.driver.name, purpose: d.description,
      amount: d.amountPaid, status: d.status, date: d.createdAt,
    }));

    const combined = [...customerRows, ...driverRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      customer: summarize(customerAmounts),
      driver: summarize(driverAmounts),
      combined: {
        totalAmount: [...customerAmounts, ...driverAmounts].reduce((s, i) => s + i.amount, 0),
        approvedAmount: [...customerAmounts, ...driverAmounts].filter(i => i.status === 'APPROVED').reduce((s, i) => s + i.amount, 0),
        pendingAmount: [...customerAmounts, ...driverAmounts].filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0),
        totalClaims: combined.length,
      },
      rows: combined,
    };
  }

  // ─── Fuel Efficiency by Vehicle ────────────────────────────────────────────

  async getFuelEfficiencyReport() {
    const vehicles = await this.prisma.vehicle.findMany({
      select: {
        id: true, vehicleNumber: true, model: true, fuelType: true, capacity: true,
        fuelLogs: {
          select: { liters: true, amount: true, currentMileage: true, createdAt: true, driver: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const mileageLogs = await this.prisma.mileageLog.findMany({
      select: { vehicleId: true, startMileage: true, endMileage: true },
    });

    const kmByVehicle = new Map<number, number>();
    for (const m of mileageLogs) {
      if (!m.vehicleId) continue;
      const dist = m.endMileage - m.startMileage;
      if (dist > 0) kmByVehicle.set(m.vehicleId, (kmByVehicle.get(m.vehicleId) ?? 0) + dist);
    }

    const rows = vehicles
      .filter(v => v.fuelLogs.length > 0)
      .map(v => {
        const totalLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
        const totalAmount = v.fuelLogs.reduce((s, f) => s + f.amount, 0);
        const totalKm = kmByVehicle.get(v.id) ?? 0;
        const kmPerLiter = totalKm > 0 && totalLiters > 0 ? +(totalKm / totalLiters).toFixed(2) : 0;
        const costPerKm = totalKm > 0 && totalAmount > 0 ? +(totalAmount / totalKm).toFixed(2) : 0;
        const avgCostPerLiter = totalLiters > 0 ? +(totalAmount / totalLiters).toFixed(1) : 0;
        const drivers = [...new Set(v.fuelLogs.map(f => f.driver.name))].join(', ');
        const lastRefuel = v.fuelLogs[v.fuelLogs.length - 1]?.createdAt ?? null;

        return {
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          model: v.model,
          fuelType: v.fuelType,
          capacity: v.capacity,
          totalLiters,
          totalAmount,
          totalKm,
          kmPerLiter,
          costPerKm,
          avgCostPerLiter,
          fuelEntries: v.fuelLogs.length,
          drivers,
          lastRefuel,
        };
      })
      .sort((a, b) => b.kmPerLiter - a.kmPerLiter);

    const totals = {
      totalVehicles: rows.length,
      totalLiters: rows.reduce((s, r) => s + r.totalLiters, 0),
      totalAmount: rows.reduce((s, r) => s + r.totalAmount, 0),
      totalKm: rows.reduce((s, r) => s + r.totalKm, 0),
      avgKmPerLiter: rows.length ? +(rows.reduce((s, r) => s + r.kmPerLiter, 0) / rows.length).toFixed(2) : 0,
    };

    return { totals, rows };
  }
}
