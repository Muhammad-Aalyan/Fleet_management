import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidesController {
  constructor(private svc: RidesService) {}

  // ─── Notifications ───────────────────────────────────────────────
  @Get('notifications')
  @Roles('ADMIN', 'DRIVER', 'CUSTOMER')
  getNotifications(@CurrentUser() user: { id: number }) {
    return this.svc.getNotifications(user.id);
  }

  @Patch('notifications/:id/read')
  @Roles('ADMIN', 'DRIVER', 'CUSTOMER')
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.svc.markNotificationRead(id, user.id);
  }

  @Patch('notifications/read-all')
  @Roles('ADMIN', 'DRIVER', 'CUSTOMER')
  markAllRead(@CurrentUser() user: { id: number }) {
    return this.svc.markAllNotificationsRead(user.id);
  }

  // ─── Ride Queries ────────────────────────────────────────────────
  @Get()
  @Roles('ADMIN')
  findAll(@Query('status') status?: string) { return this.svc.findAll(status); }

  @Get('my')
  @Roles('CUSTOMER')
  myRides(@CurrentUser() user: { id: number }) { return this.svc.findByCustomer(user.id); }

  @Get('driver')
  @Roles('DRIVER')
  driverRides(@CurrentUser() user: { id: number }) { return this.svc.findByDriver(user.id); }

  @Get('available')
  @Roles('CUSTOMER')
  available(@Query('pickup') pickup: string) { return this.svc.findAvailableNearby(pickup ?? ''); }

  @Get('available-all')
  @Roles('CUSTOMER')
  availableAll(@CurrentUser() user: { id: number }) { return this.svc.findAllAvailable(user.id); }

  @Get(':id')
  @Roles('ADMIN', 'CUSTOMER', 'DRIVER')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  // ─── Customer Actions ────────────────────────────────────────────
  @Post()
  @Roles('CUSTOMER')
  create(@CurrentUser() user: { id: number }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }

  @Patch(':id/cancel')
  @Roles('CUSTOMER', 'ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number; role: string }) {
    return this.svc.cancel(id, user.id, user.role);
  }

  // ─── Admin Actions ───────────────────────────────────────────────
  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.svc.approve(id, user.id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN')
  adminReject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks?: string },
    @CurrentUser() user: { id: number }
  ) {
    return this.svc.adminReject(id, user.id, body.remarks);
  }

  @Patch(':id/assign')
  @Roles('ADMIN')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { driverId: number; vehicleId: number },
    @CurrentUser() user: { id: number }
  ) {
    return this.svc.assign(id, body.driverId, body.vehicleId, user.id);
  }

  @Patch(':id/urgent-assign')
  @Roles('ADMIN')
  urgentAssign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { driverId: number; vehicleId: number; bumpRideIds: number[] },
    @CurrentUser() user: { id: number }
  ) {
    return this.svc.urgentAssign(id, body.driverId, body.vehicleId, user.id, body.bumpRideIds ?? []);
  }

  // ─── Driver Actions ──────────────────────────────────────────────
  @Patch(':id/accept')
  @Roles('DRIVER')
  driverAccept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.svc.driverAccept(id, user.id);
  }

  @Patch(':id/driver-reject')
  @Roles('DRIVER')
  driverReject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remarks: string },
    @CurrentUser() user: { id: number }
  ) {
    return this.svc.driverReject(id, user.id, body.remarks);
  }

  @Patch(':id/complete')
  @Roles('DRIVER')
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.svc.completeRide(id, user.id);
  }
}
