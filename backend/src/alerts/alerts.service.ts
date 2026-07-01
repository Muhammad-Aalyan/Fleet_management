import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: { reason: string; description?: string }) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!driver) throw new ForbiddenException('Driver not found');

    const alert = await this.prisma.stuckAlert.create({
      data: { driverId: driver.id, reason: data.reason, description: data.description },
      include: { driver: true },
    });

    // Notify all admin users
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    const reasonLabel = data.reason.replace('_', ' ');
    await Promise.all(admins.map(admin =>
      this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: `🚨 Emergency Alert — ${driver.name}`,
          message: `${driver.name} has sent an emergency alert: ${reasonLabel}${data.description ? `. "${data.description}"` : ''}`,
        },
      })
    ));

    return alert;
  }

  findAll() {
    return this.prisma.stuckAlert.findMany({
      include: { driver: { include: { vehicle: true, user: { select: { email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findUnresolved() {
    return this.prisma.stuckAlert.findMany({
      where: { resolved: false },
      include: { driver: { include: { vehicle: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  resolve(id: number) {
    return this.prisma.stuckAlert.update({ where: { id }, data: { resolved: true } });
  }
}
