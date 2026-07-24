import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { PlannerDashboardService } from './planner-dashboard.service';
import { PlannerGateway } from './planner.gateway';
import { WeddingPlan, WeddingTask, WeddingEvent, PlannerActivity } from './entities/planner.entity';
import { FinanceModule } from '../finance/finance.module';
import { EventsModule } from '../events/events.module';
import { VendorsModule } from '../vendors/vendors.module';
import { UsersModule } from '../users/users.module';
import { GuestEntity } from '../events/entities/event.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeddingPlan, WeddingTask, WeddingEvent, PlannerActivity, GuestEntity], POSTGRES_CONNECTION),
    FinanceModule,
    EventsModule,
    VendorsModule,
    UsersModule,
  ],
  controllers: [PlannerController],
  providers: [PlannerService, PlannerDashboardService, PlannerGateway],
  exports: [PlannerService, PlannerDashboardService, PlannerGateway],
})
export class PlannerModule {}
