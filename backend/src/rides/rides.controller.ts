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

  @Get(':id')
  @Roles('ADMIN', 'CUSTOMER', 'DRIVER')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()
  @Roles('CUSTOMER')
  create(@CurrentUser() user: { id: number }, @Body() body: any) { return this.svc.create(user.id, body); }

  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) { return this.svc.updateStatus(id, 'APPROVED', user.id); }

  @Patch(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) { return this.svc.updateStatus(id, 'REJECTED', user.id); }

  @Patch(':id/assign')
  @Roles('ADMIN')
  assign(@Param('id', ParseIntPipe) id: number, @Body() body: { driverId: number; vehicleId: number }, @CurrentUser() user: { id: number }) {
    return this.svc.assign(id, body.driverId, body.vehicleId, user.id);
  }

  @Patch(':id/start')
  @Roles('DRIVER')
  start(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) { return this.svc.startRide(id, user.id); }

  @Patch(':id/complete')
  @Roles('DRIVER')
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) { return this.svc.completeRide(id, user.id); }

  @Patch(':id/cancel')
  @Roles('CUSTOMER', 'ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) { return this.svc.updateStatus(id, 'CANCELLED', user.id); }
}
