import { Module } from '@nestjs/common';
import { LampsService } from './lamps.service';
import { LampsController } from './lamps.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  controllers: [LampsController, CategoriesController],
  providers: [LampsService, CategoriesService],
  exports: [LampsService],
})
export class LampsModule {}
