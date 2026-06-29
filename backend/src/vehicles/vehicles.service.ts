import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.vehicle.findMany({ include: { drivers: true } }); }

  findAvailable() { return this.prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } }); }

  async findOne(id: number) {
    const v = await this.prisma.vehicle.findUnique({ where: { id }, include: { drivers: true } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  create(data: { vehicleNumber: string; model: string; year: number; capacity: number; fuelType: string }) {
    return this.prisma.vehicle.create({ data });
  }

  update(id: number, data: any) { return this.prisma.vehicle.update({ where: { id }, data }); }
}
