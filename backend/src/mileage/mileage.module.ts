import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageController } from './mileage.controller';

@Module({ providers: [MileageService], controllers: [MileageController] })
export class MileageModule {}
