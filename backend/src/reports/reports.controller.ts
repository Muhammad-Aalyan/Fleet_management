import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('rides')
  rides() { return this.svc.getRidesReport(); }

  @Get('customers')
  customers() { return this.svc.getCustomersReport(); }

  @Get('fuel')
  fuel() { return this.svc.getFuelReport(); }

  @Get('driver-performance')
  driverPerformance() { return this.svc.getDriverPerformanceReport(); }

  @Get('vehicle-utilization')
  vehicleUtilization() { return this.svc.getVehicleUtilizationReport(); }

  @Get('route-analysis')
  routeAnalysis() { return this.svc.getRouteAnalysisReport(); }

  @Get('reimbursements')
  reimbursements() { return this.svc.getReimbursementsSummaryReport(); }

  @Get('fuel-efficiency')
  fuelEfficiency() { return this.svc.getFuelEfficiencyReport(); }
}
