import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private svc: AlertsService) {}

  @Post()
  @Roles('DRIVER')
  create(@CurrentUser() user: { id: number }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }

  @Get()
  @Roles('ADMIN')
  findAll() { return this.svc.findAll(); }

  @Get('unresolved')
  @Roles('ADMIN')
  unresolved() { return this.svc.findUnresolved(); }

  @Patch(':id/resolve')
  @Roles('ADMIN')
  resolve(@Param('id', ParseIntPipe) id: number) { return this.svc.resolve(id); }
}
