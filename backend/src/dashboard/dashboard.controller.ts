import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get('stats')
  @Roles('ADMIN')
  stats() { return this.svc.getStats(); }

  @Get('recent-requests')
  @Roles('ADMIN')
  recent() { return this.svc.getRecentRequests(); }

  @Get('active-rides')
  @Roles('ADMIN')
  activeRides() { return this.svc.getActiveRides(); }

  @Get('customers')
  @Roles('ADMIN')
  customers() { return this.svc.getCustomers(); }
}
