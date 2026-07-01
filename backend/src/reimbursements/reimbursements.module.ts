import { Module } from '@nestjs/common';
import { ReimbursementsService } from './reimbursements.service';
import { ReimbursementsController } from './reimbursements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService],
})
export class ReimbursementsModule {}
