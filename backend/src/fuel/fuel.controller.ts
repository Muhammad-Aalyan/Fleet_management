import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('fuel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FuelController {
  constructor(private svc: FuelService) {}

  @Get()
  @Roles('ADMIN')
  findAll() { return this.svc.findAll(); }

  @Get('by-vehicle')
  @Roles('ADMIN')
  byVehicle() { return this.svc.findByVehicle(); }

  @Get('my')
  @Roles('DRIVER')
  myLogs(@CurrentUser() user: { id: number }) { return this.svc.findByDriver(user.id); }

  @Post()
  @Roles('DRIVER')
  create(@CurrentUser() user: { id: number }, @Body() body: any) { return this.svc.create(user.id, body); }

  @Patch(':id/view-receipt')
  @Roles('ADMIN')
  viewReceipt(@Param('id', ParseIntPipe) id: number) { return this.svc.viewReceipt(id); }
}
