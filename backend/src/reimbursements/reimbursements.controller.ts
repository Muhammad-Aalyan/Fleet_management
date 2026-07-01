import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReimbursementsService } from './reimbursements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('reimbursements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReimbursementsController {
  constructor(private svc: ReimbursementsService) {}

  // ─── Customer ──────────────────────────────────────────────────────────────

  @Post('customer')
  @Roles('CUSTOMER')
  createCustomer(@CurrentUser() user: { id: number }, @Body() body: any) {
    return this.svc.createCustomer(user.id, body);
  }

  @Get('customer/my')
  @Roles('CUSTOMER')
  myCustomer(@CurrentUser() user: { id: number }) {
    return this.svc.findMyCustomer(user.id);
  }

  @Get('customer')
  @Roles('ADMIN')
  allCustomer() { return this.svc.findAllCustomer(); }

  @Patch('customer/:id/review')
  @Roles('ADMIN')
  reviewCustomer(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'APPROVED' | 'REJECTED'; adminNote?: string }) {
    return this.svc.reviewCustomer(id, body.status, body.adminNote);
  }

  @Get('customer/:id/receipt')
  @Roles('ADMIN')
  customerReceipt(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getCustomerReceipt(id);
  }

  // ─── Driver ────────────────────────────────────────────────────────────────

  @Post('driver')
  @Roles('DRIVER')
  createDriver(@CurrentUser() user: { id: number }, @Body() body: any) {
    return this.svc.createDriver(user.id, body);
  }

  @Get('driver/my')
  @Roles('DRIVER')
  myDriver(@CurrentUser() user: { id: number }) {
    return this.svc.findMyDriver(user.id);
  }

  @Get('driver')
  @Roles('ADMIN')
  allDriver() { return this.svc.findAllDriver(); }

  @Patch('driver/:id/review')
  @Roles('ADMIN')
  reviewDriver(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'APPROVED' | 'REJECTED'; adminNote?: string }) {
    return this.svc.reviewDriver(id, body.status, body.adminNote);
  }

  @Get('driver/:id/receipt')
  @Roles('ADMIN')
  driverReceipt(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getDriverReceipt(id);
  }
}
