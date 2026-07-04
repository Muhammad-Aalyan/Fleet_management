import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RidesModule } from './rides/rides.module';
import { FuelModule } from './fuel/fuel.module';
import { MileageModule } from './mileage/mileage.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReimbursementsModule } from './reimbursements/reimbursements.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DriversModule,
    VehiclesModule,
    RidesModule,
    FuelModule,
    MileageModule,
    DashboardModule,
    AlertsModule,
    ReimbursementsModule,
    ReportsModule,
  ],
})
export class AppModule {}
