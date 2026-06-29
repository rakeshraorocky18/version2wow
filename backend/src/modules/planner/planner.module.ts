import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { WeddingPlan, WeddingTask, WeddingEvent } from './entities/planner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingPlan, WeddingTask, WeddingEvent])],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
