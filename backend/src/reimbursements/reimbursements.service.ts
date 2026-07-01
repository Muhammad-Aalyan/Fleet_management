import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const customerInclude = {
  customer: { include: { user: { select: { id: true, email: true } } } },
};
const driverInclude = {
  driver: { include: { user: { select: { id: true, email: true } } } },
};

@Injectable()
export class ReimbursementsService {
  constructor(private prisma: PrismaService) {}

  private async notifyAdmins(title: string, message: string) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    await Promise.all(admins.map(a =>
      this.prisma.notification.create({ data: { userId: a.id, title, message } })
    ));
  }

  private async notifyUser(userId: number, title: string, message: string) {
    await this.prisma.notification.create({ data: { userId, title, message } });
  }

  // ─── Customer ────────────────────────────────────────────────────────────────

  async createCustomer(userId: number, data: {
    destination: string; travelDate: string; purpose: string;
    travelMode: string; amount: number; receiptPhoto?: string; notes?: string;
  }) {
    const customer = await this.prisma.customer.findUnique({ where: { userId }, include: { user: true } });
    if (!customer) throw new ForbiddenException('Customer not found');

    const claim = await this.prisma.customerReimbursement.create({
      data: {
        customerId: customer.id,
        destination: data.destination,
        travelDate: new Date(data.travelDate),
        purpose: data.purpose,
        travelMode: data.travelMode,
        amount: data.amount,
        receiptPhoto: data.receiptPhoto ?? null,
        notes: data.notes ?? null,
      },
      include: customerInclude,
    });

    await this.notifyAdmins(
      `💰 Customer Reimbursement — ${customer.name}`,
      `${customer.name} submitted a reimbursement claim of PKR ${data.amount.toLocaleString()} for ${data.purpose} (${data.destination}).`,
    );

    return claim;
  }

  async findAllCustomer() {
    return this.prisma.customerReimbursement.findMany({
      include: customerInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyCustomer(userId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Customer not found');
    return this.prisma.customerReimbursement.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewCustomer(id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
    const claim = await this.prisma.customerReimbursement.findUnique({
      where: { id }, include: customerInclude,
    });
    if (!claim) throw new NotFoundException('Claim not found');

    const updated = await this.prisma.customerReimbursement.update({
      where: { id }, data: { status, adminNote: adminNote ?? null },
      include: customerInclude,
    });

    const emoji = status === 'APPROVED' ? '✅' : '❌';
    await this.notifyUser(
      claim.customer.user.id,
      `${emoji} Reimbursement ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      `Your reimbursement claim of PKR ${claim.amount.toLocaleString()} for ${claim.purpose} has been ${status.toLowerCase()}.${adminNote ? ` Note: ${adminNote}` : ''}`,
    );

    return updated;
  }

  async getCustomerReceipt(id: number) {
    const claim = await this.prisma.customerReimbursement.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    return { receiptPhoto: claim.receiptPhoto };
  }

  // ─── Driver ──────────────────────────────────────────────────────────────────

  async createDriver(userId: number, data: {
    description: string; workDone: string; amountPaid: number; receiptPhoto?: string;
  }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId }, include: { user: true } });
    if (!driver) throw new ForbiddenException('Driver not found');

    const claim = await this.prisma.driverReimbursement.create({
      data: {
        driverId: driver.id,
        description: data.description,
        workDone: data.workDone,
        amountPaid: data.amountPaid,
        receiptPhoto: data.receiptPhoto ?? null,
      },
      include: driverInclude,
    });

    await this.notifyAdmins(
      `🔧 Driver Reimbursement — ${driver.name}`,
      `${driver.name} submitted a reimbursement claim of PKR ${data.amountPaid.toLocaleString()} for: ${data.description}.`,
    );

    return claim;
  }

  async findAllDriver() {
    return this.prisma.driverReimbursement.findMany({
      include: driverInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    return this.prisma.driverReimbursement.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewDriver(id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
    const claim = await this.prisma.driverReimbursement.findUnique({
      where: { id }, include: driverInclude,
    });
    if (!claim) throw new NotFoundException('Claim not found');

    const updated = await this.prisma.driverReimbursement.update({
      where: { id }, data: { status, adminNote: adminNote ?? null },
      include: driverInclude,
    });

    const emoji = status === 'APPROVED' ? '✅' : '❌';
    await this.notifyUser(
      claim.driver.user.id,
      `${emoji} Reimbursement ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      `Your reimbursement claim of PKR ${claim.amountPaid.toLocaleString()} for "${claim.description}" has been ${status.toLowerCase()}.${adminNote ? ` Note: ${adminNote}` : ''}`,
    );

    return updated;
  }

  async getDriverReceipt(id: number) {
    const claim = await this.prisma.driverReimbursement.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    return { receiptPhoto: claim.receiptPhoto };
  }
}
