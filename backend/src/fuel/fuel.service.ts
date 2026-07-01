import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const vehicleInclude = {
  vehicle: { select: { id: true, vehicleNumber: true, model: true, fuelType: true } },
  driver: { select: { id: true, name: true } },
};

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  private async cleanupOldReceipts() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.fuelLog.updateMany({
      where: { receiptViewedAt: { not: null, lt: cutoff }, receiptPhoto: { not: null } },
      data: { receiptPhoto: null },
    });
  }

  async findAll() {
    await this.cleanupOldReceipts();
    return this.prisma.fuelLog.findMany({
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVehicle() {
    await this.cleanupOldReceipts();
    const vehicles = await this.prisma.vehicle.findMany({
      select: {
        id: true, vehicleNumber: true, model: true, fuelType: true,
        fuelLogs: {
          select: { id: true, liters: true, amount: true, currentMileage: true, receiptPhoto: true, receiptViewedAt: true, createdAt: true, driver: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return vehicles.map(v => ({
      vehicleId:   v.id,
      vehicleNumber: v.vehicleNumber,
      model:       v.model,
      fuelType:    v.fuelType,
      totalEntries: v.fuelLogs.length,
      totalLiters:  v.fuelLogs.reduce((s, l) => s + l.liters, 0),
      totalAmount:  v.fuelLogs.reduce((s, l) => s + l.amount, 0),
      lastFuelDate: v.fuelLogs[0]?.createdAt ?? null,
      logs:         v.fuelLogs,
    }));
  }

  async findByDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.fuelLog.findMany({
      where: { driverId: driver.id },
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: number, data: {
    vehicleId: number; liters: number; amount: number;
    currentMileage: number; receiptPhoto?: string;
  }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.fuelLog.create({
      data: {
        driverId: driver.id,
        vehicleId: data.vehicleId,
        liters: data.liters,
        amount: data.amount,
        currentMileage: data.currentMileage,
        receiptPhoto: data.receiptPhoto ?? null,
      },
      include: vehicleInclude,
    });
  }

  async viewReceipt(id: number) {
    const log = await this.prisma.fuelLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Fuel log not found');
    if (!log.receiptPhoto) return { receiptPhoto: null, message: 'No receipt stored or already deleted' };
    if (!log.receiptViewedAt) {
      await this.prisma.fuelLog.update({ where: { id }, data: { receiptViewedAt: new Date() } });
    }
    return { receiptPhoto: log.receiptPhoto, receiptViewedAt: log.receiptViewedAt };
  }
}
