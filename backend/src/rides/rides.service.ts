import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const rideInclude = {
  customer: { include: { user: { select: { id: true, email: true } } } },
  assignment: { include: { driver: { include: { user: { select: { id: true, email: true } } } }, vehicle: true } },
  statusHistory: { orderBy: { changedAt: 'desc' as const }, take: 10 },
};

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  private async notify(userId: number, title: string, message: string) {
    await this.prisma.notification.create({ data: { userId, title, message } });
  }

  private async getAdminUserIds(): Promise<number[]> {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    return admins.map(a => a.id);
  }

  findAll(status?: string) {
    return this.prisma.rideRequest.findMany({
      where: status ? { status } : undefined,
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByCustomer(userId: number) {
    return this.prisma.rideRequest.findMany({
      where: { customer: { userId } },
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

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

  // CUSTOMER: create ride request
  async create(userId: number, data: {
    pickupLocation: string; dropLocation: string;
    scheduledDate: string; scheduledTime: string;
    passengers: number; purpose?: string; remarks?: string;
  }) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Customer profile not found');

    const ride = await this.prisma.rideRequest.create({
      data: { customerId: customer.id, ...data, scheduledDate: new Date(data.scheduledDate) },
      include: rideInclude,
    });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: ride.id, status: 'PENDING', changedBy: userId } });

    // Notify all admins of new request
    const adminIds = await this.getAdminUserIds();
    await Promise.all(adminIds.map(adminId =>
      this.notify(adminId, 'New Ride Request', `New ride request from ${customer.name}: ${data.pickupLocation} → ${data.dropLocation}`)
    ));

    return ride;
  }

  // ADMIN: approve request
  async approve(id: number, userId: number) {
    const ride = await this.findOne(id);
    if (ride.status !== 'PENDING') throw new BadRequestException('Only PENDING rides can be approved');

    await this.prisma.rideRequest.update({ where: { id }, data: { status: 'APPROVED' } });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status: 'APPROVED', changedBy: userId } });

    // Notify customer
    await this.notify(
      ride.customer.user.id,
      'Ride Request Approved',
      `Your ride request (${ride.pickupLocation} → ${ride.dropLocation}) has been approved. A driver will be assigned shortly.`
    );

    return this.findOne(id);
  }

  // ADMIN: reject request
  async adminReject(id: number, userId: number, remarks?: string) {
    const ride = await this.findOne(id);
    if (!['PENDING', 'APPROVED'].includes(ride.status)) throw new BadRequestException('Ride cannot be rejected at this stage');

    await this.prisma.rideRequest.update({ where: { id }, data: { status: 'REJECTED', remarks: remarks ?? ride.remarks } });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status: 'REJECTED', changedBy: userId } });

    // Notify customer
    await this.notify(
      ride.customer.user.id,
      'Ride Request Rejected',
      `Your ride request (${ride.pickupLocation} → ${ride.dropLocation}) has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`
    );

    return this.findOne(id);
  }

  // ADMIN: urgent assign — reduces the REQUESTING ride's passengers to fit available seats, existing rides untouched
  async urgentAssign(id: number, driverId: number, vehicleId: number, userId: number, _bumpRideIds: number[]) {
    const urgentRide = await this.findOne(id);
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // How many seats are currently occupied on this vehicle
    const agg = await this.prisma.rideRequest.aggregate({
      where: { status: { in: ['IN_PROGRESS', 'ASSIGNED'] }, assignment: { vehicleId } },
      _sum: { passengers: true },
    });
    const seatsTaken = agg._sum.passengers ?? 0;
    const seatsAvailable = vehicle.capacity - seatsTaken;

    const originalPassengers = urgentRide.passengers;
    const adjustedPassengers = Math.min(originalPassengers, seatsAvailable);
    const passengersRemoved = originalPassengers - adjustedPassengers;

    if (adjustedPassengers <= 0) {
      throw new BadRequestException('No seats available even for urgent assignment. Fully occupied.');
    }

    // Reduce the requesting ride's passenger count to what fits
    if (passengersRemoved > 0) {
      await this.prisma.rideRequest.update({
        where: { id },
        data: {
          passengers: adjustedPassengers,
          remarks: `Urgently approved. ${passengersRemoved} passenger${passengersRemoved > 1 ? 's' : ''} removed to fit available capacity (${seatsAvailable} seat${seatsAvailable > 1 ? 's' : ''} free of ${vehicle.capacity}).`,
        },
      });

      // Notify the requesting customer about the reduction
      await this.notify(
        urgentRide.customer.user.id,
        '✅ Urgent Ride Approved — Passengers Adjusted',
        `Your ride (${urgentRide.pickupLocation} → ${urgentRide.dropLocation}) has been urgently approved! However, since the vehicle only had ${seatsAvailable} seat${seatsAvailable > 1 ? 's' : ''} available, your passenger count has been reduced from ${originalPassengers} to ${adjustedPassengers}. We apologise for the inconvenience.`
      );
    }

    // Now assign normally — capacity check will pass since we updated passenger count
    return this.assign(id, driverId, vehicleId, userId);
  }

  // ADMIN: assign driver + vehicle → notifies driver
  async assign(id: number, driverId: number, vehicleId: number, userId: number) {
    const ride = await this.findOne(id);
    if (!['APPROVED'].includes(ride.status) && ride.status !== 'PENDING') {
      throw new BadRequestException('Ride must be APPROVED before assigning');
    }

    const driver = await this.prisma.driver.findUnique({ where: { id: driverId }, include: { user: true } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (!['AVAILABLE', 'ON_RIDE'].includes(driver.status)) throw new BadRequestException('Driver is not available');

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!['AVAILABLE', 'IN_RIDE'].includes(vehicle.status)) throw new BadRequestException('Vehicle is not available');

    // If driver is ON_RIDE or vehicle is IN_RIDE, only allow if the new ride is the SAME route+schedule (shared ride)
    if (driver.status === 'ON_RIDE' || vehicle.status === 'IN_RIDE') {
      const activeRide = await this.prisma.rideRequest.findFirst({
        where: {
          status: { in: ['IN_PROGRESS', 'ASSIGNED'] },
          assignment: { driverId, vehicleId },
        },
      });
      if (!activeRide) throw new BadRequestException('Driver/vehicle is busy with another ride');

      const isSameRoute =
        activeRide.pickupLocation === ride.pickupLocation &&
        activeRide.dropLocation === ride.dropLocation &&
        activeRide.scheduledDate.toISOString() === new Date(ride.scheduledDate).toISOString() &&
        activeRide.scheduledTime === ride.scheduledTime;

      if (!isSameRoute) {
        throw new BadRequestException(
          'Driver is already on a different ride. Only assign to the same route and schedule for a shared ride.'
        );
      }

      // Check vehicle capacity: sum all ASSIGNED + IN_PROGRESS passengers on this vehicle+schedule
      const existingPassengers = await this.prisma.rideRequest.aggregate({
        where: {
          status: { in: ['IN_PROGRESS', 'ASSIGNED'] },
          pickupLocation: ride.pickupLocation,
          dropLocation: ride.dropLocation,
          scheduledDate: activeRide.scheduledDate,
          scheduledTime: ride.scheduledTime,
          assignment: { vehicleId },
        },
        _sum: { passengers: true },
      });
      const totalAfter = (existingPassengers._sum.passengers ?? 0) + ride.passengers;
      if (totalAfter > vehicle.capacity) {
        throw new BadRequestException(
          `Vehicle capacity exceeded: ${existingPassengers._sum.passengers ?? 0} passengers already aboard, adding ${ride.passengers} would exceed capacity of ${vehicle.capacity}.`
        );
      }
    }

    const existing = await this.prisma.rideAssignment.findUnique({ where: { rideRequestId: id } });
    if (existing) {
      await this.prisma.rideAssignment.update({ where: { rideRequestId: id }, data: { driverId, vehicleId } });
    } else {
      await this.prisma.rideAssignment.create({ data: { rideRequestId: id, driverId, vehicleId } });
    }

    // Only update statuses if not already ON_RIDE/IN_RIDE (shared ride — keep as-is)
    if (driver.status === 'AVAILABLE') {
      await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ON_RIDE' } });
    }
    if (vehicle.status === 'AVAILABLE') {
      await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_RIDE' } });
    }
    await this.prisma.rideRequest.update({ where: { id }, data: { status: 'ASSIGNED' } });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status: 'ASSIGNED', changedBy: userId } });

    // Notify driver of new assignment
    await this.notify(
      driver.user.id,
      'New Ride Assigned',
      `You have been assigned a ride: ${ride.pickupLocation} → ${ride.dropLocation} on ${new Date(ride.scheduledDate).toLocaleDateString()} at ${ride.scheduledTime}. Please accept or reject.`
    );

    return this.findOne(id);
  }

  // DRIVER: accept assigned ride → notifies customer + admin
  async driverAccept(id: number, userId: number) {
    const ride = await this.findOne(id);
    if (ride.status !== 'ASSIGNED') throw new BadRequestException('Ride must be ASSIGNED to accept');
    if (!ride.assignment) throw new BadRequestException('No assignment found for this ride');

    const driverCheck = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driverCheck || driverCheck.id !== ride.assignment.driverId) throw new ForbiddenException('You are not assigned to this ride');

    const now = new Date();
    const driverId = ride.assignment.driverId;
    const vehicleId = ride.assignment.vehicleId;

    // Find all ASSIGNED rides on the same route+schedule+driver+vehicle (shared ride group)
    const sharedRides = await this.prisma.rideRequest.findMany({
      where: {
        status: 'ASSIGNED',
        pickupLocation: ride.pickupLocation,
        dropLocation: ride.dropLocation,
        scheduledDate: ride.scheduledDate,
        scheduledTime: ride.scheduledTime,
        assignment: { driverId, vehicleId },
      },
      include: { ...rideInclude },
    });

    // Start all rides in the shared group simultaneously
    await Promise.all(sharedRides.map(async (sr) => {
      await this.prisma.rideRequest.update({ where: { id: sr.id }, data: { status: 'IN_PROGRESS' } });
      await this.prisma.rideAssignment.update({ where: { rideRequestId: sr.id }, data: { startedAt: now } });
      await this.prisma.rideStatusHistory.create({ data: { rideRequestId: sr.id, status: 'IN_PROGRESS', changedBy: userId } });
      await this.notify(
        sr.customer.user.id,
        'Driver On The Way',
        `Your driver ${ride.assignment!.driver.name} has accepted your ride (${sr.pickupLocation} → ${sr.dropLocation}) and is on the way.`
      );
    }));

    // Notify all admins once
    const adminIds = await this.getAdminUserIds();
    const customerNames = sharedRides.map(sr => sr.customer.name).join(', ');
    await Promise.all(adminIds.map(adminId =>
      this.notify(adminId, 'Ride Started',
        `Driver ${ride.assignment!.driver.name} accepted ride #${id} for ${customerNames}.`)
    ));

    return this.findOne(id);
  }

  // DRIVER: reject assigned ride (with mandatory remarks) → notifies admin only
  async driverReject(id: number, userId: number, remarks: string) {
    if (!remarks || remarks.trim().length === 0) throw new BadRequestException('Rejection remarks are required');

    const ride = await this.findOne(id);
    if (ride.status !== 'ASSIGNED') throw new BadRequestException('Ride must be ASSIGNED to reject');
    if (!ride.assignment) throw new BadRequestException('No assignment found for this ride');

    const driverCheck = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driverCheck || driverCheck.id !== ride.assignment.driverId) throw new ForbiddenException('You are not assigned to this ride');

    const driverName = ride.assignment.driver.name;

    // Free up driver and vehicle
    await this.prisma.driver.update({ where: { id: ride.assignment.driverId }, data: { status: 'AVAILABLE' } });
    await this.prisma.vehicle.update({ where: { id: ride.assignment.vehicleId }, data: { status: 'AVAILABLE' } });

    // Remove assignment so admin can reassign
    await this.prisma.rideAssignment.delete({ where: { rideRequestId: id } });

    // Reset to APPROVED so admin can reassign
    await this.prisma.rideRequest.update({ where: { id }, data: { status: 'APPROVED', remarks } });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status: 'APPROVED', changedBy: userId } });

    // Notify admins only
    const adminIds = await this.getAdminUserIds();
    await Promise.all(adminIds.map(adminId =>
      this.notify(adminId, 'Driver Rejected Ride',
        `Driver ${driverName} rejected ride #${id} (${ride.pickupLocation} → ${ride.dropLocation}). Reason: ${remarks}. Please reassign a driver.`)
    ));

    return this.findOne(id);
  }

  // DRIVER: complete ride → auto-completes all shared rides (same driver+vehicle+schedule)
  async completeRide(id: number, userId: number) {
    const ride = await this.findOne(id);
    if (ride.status !== 'IN_PROGRESS') throw new BadRequestException('Ride must be IN_PROGRESS to complete');
    if (!ride.assignment) throw new BadRequestException('No assignment found');

    const driverCheck = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driverCheck || driverCheck.id !== ride.assignment.driverId) throw new ForbiddenException('You are not assigned to this ride');

    // Find all shared rides: same driver + vehicle + pickup + drop + date, still IN_PROGRESS
    const sharedRides = await this.prisma.rideRequest.findMany({
      where: {
        status: 'IN_PROGRESS',
        pickupLocation: ride.pickupLocation,
        dropLocation: ride.dropLocation,
        scheduledDate: ride.scheduledDate,
        scheduledTime: ride.scheduledTime,
        assignment: { driverId: ride.assignment.driverId, vehicleId: ride.assignment.vehicleId },
      },
      include: { ...rideInclude },
    });

    const now = new Date();
    // Complete all shared rides at once
    await Promise.all(sharedRides.map(async (sr) => {
      await this.prisma.rideAssignment.update({ where: { rideRequestId: sr.id }, data: { completedAt: now } });
      await this.prisma.rideRequest.update({ where: { id: sr.id }, data: { status: 'COMPLETED' } });
      await this.prisma.rideStatusHistory.create({ data: { rideRequestId: sr.id, status: 'COMPLETED', changedBy: userId } });
      // Notify each customer
      await this.notify(
        sr.customer.user.id,
        'Ride Completed',
        `Your ride (${sr.pickupLocation} → ${sr.dropLocation}) has been completed. Thank you for riding with us!`
      );
    }));

    // Free driver and vehicle once (shared)
    await this.prisma.driver.update({ where: { id: ride.assignment.driverId }, data: { status: 'AVAILABLE' } });
    await this.prisma.vehicle.update({ where: { id: ride.assignment.vehicleId }, data: { status: 'AVAILABLE' } });

    // Notify admins
    const adminIds = await this.getAdminUserIds();
    const sharedNote = sharedRides.length > 1 ? ` (shared ride — ${sharedRides.length} passengers completed)` : '';
    await Promise.all(adminIds.map(adminId =>
      this.notify(adminId, 'Ride Completed',
        `Ride #${id} (${ride.pickupLocation} → ${ride.dropLocation}) completed by driver ${ride.assignment!.driver.name}${sharedNote}.`)
    ));

    return this.findOne(id);
  }

  // CUSTOMER/ADMIN: cancel
  async cancel(id: number, userId: number, role?: string) {
    const ride = await this.findOne(id);
    if (['COMPLETED', 'CANCELLED'].includes(ride.status)) throw new BadRequestException('Ride cannot be cancelled');

    // Customers can only cancel their own rides
    if (role === 'CUSTOMER' && ride.customer.user.id !== userId) {
      throw new ForbiddenException('You can only cancel your own rides');
    }

    if (ride.assignment) {
      await this.prisma.driver.update({ where: { id: ride.assignment.driverId }, data: { status: 'AVAILABLE' } });
      await this.prisma.vehicle.update({ where: { id: ride.assignment.vehicleId }, data: { status: 'AVAILABLE' } });
    }

    await this.prisma.rideRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.prisma.rideStatusHistory.create({ data: { rideRequestId: id, status: 'CANCELLED', changedBy: userId } });

    // Notify all admins
    const adminIds = await this.getAdminUserIds();
    await Promise.all(adminIds.map(adminId =>
      this.notify(adminId, 'Ride Cancelled', `Ride #${id} (${ride.pickupLocation} → ${ride.dropLocation}) has been cancelled.`)
    ));

    return this.findOne(id);
  }

  // Get notifications for logged-in user
  getNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Mark notification as read
  markNotificationRead(notificationId: number, userId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // Mark all notifications as read
  markAllNotificationsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  findAvailableNearby(pickupLocation: string) {
    return this.prisma.rideRequest.findMany({
      where: {
        status: { in: ['APPROVED', 'ASSIGNED'] },
        pickupLocation: { contains: pickupLocation.split(' ')[0] },
      },
      include: { assignment: { include: { driver: true, vehicle: true } } },
    });
  }

  // All available rides visible to any customer (excluding their own)
  findAllAvailable(currentUserId: number) {
    return this.prisma.rideRequest.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'] },
        customer: { userId: { not: currentUserId } },
      },
      include: {
        customer: { select: { name: true } },
        assignment: {
          include: {
            driver: { select: { name: true } },
            vehicle: { select: { vehicleNumber: true, model: true, capacity: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });
  }
}
