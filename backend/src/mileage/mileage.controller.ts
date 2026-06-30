import { Controller, Get, Post, Patch, Param, ParseIntPipe, Body, UseGuards } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('mileage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MileageController {
  constructor(private svc: MileageService) {}

  @Get()
  @Roles('ADMIN')
  findAll() { return this.svc.findAll(); }

  @Get('my')
  @Roles('DRIVER')
  myLogs(@CurrentUser() user: { id: number }) { return this.svc.findByDriver(user.id); }

  @Get('by-ride/:rideId')
  @Roles('DRIVER')
  byRide(@Param('rideId', ParseIntPipe) rideId: number, @CurrentUser() user: { id: number }) {
    return this.svc.findByRideId(rideId, user.id);
  }

  @Post()
  @Roles('DRIVER')
  create(@CurrentUser() user: { id: number }, @Body() body: any) { return this.svc.create(user.id, body); }

  @Patch(':id/end')
  @Roles('DRIVER')
  updateEnd(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() body: { endMileage: number }
  ) { return this.svc.updateEnd(id, user.id, body.endMileage); }
}
