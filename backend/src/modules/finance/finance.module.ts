import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import {
  BudgetEntity, BudgetItemEntity, ExpenseEntity,
  LoanApplicationEntity, GiftRegistryItemEntity,
} from './entities/finance.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BudgetEntity, BudgetItemEntity, ExpenseEntity,
      LoanApplicationEntity, GiftRegistryItemEntity,
    ], POSTGRES_CONNECTION),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
