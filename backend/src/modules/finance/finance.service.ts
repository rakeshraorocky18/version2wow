import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BudgetEntity, BudgetItemEntity, ExpenseEntity,
  LoanApplicationEntity, GiftRegistryItemEntity,
} from './entities/finance.entity';
import {
  CreateBudgetDto, AddBudgetItemDto, AddExpenseDto,
  ApplyLoanDto, AddGiftItemDto,
} from './dto/finance.dto';
import { LoanStatus, GiftStatus } from '../../common/enums';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(BudgetEntity, POSTGRES_CONNECTION) private budgetRepo: Repository<BudgetEntity>,
    @InjectRepository(BudgetItemEntity, POSTGRES_CONNECTION) private budgetItemRepo: Repository<BudgetItemEntity>,
    @InjectRepository(ExpenseEntity, POSTGRES_CONNECTION) private expenseRepo: Repository<ExpenseEntity>,
    @InjectRepository(LoanApplicationEntity, POSTGRES_CONNECTION) private loanRepo: Repository<LoanApplicationEntity>,
    @InjectRepository(GiftRegistryItemEntity, POSTGRES_CONNECTION) private giftRepo: Repository<GiftRegistryItemEntity>,
  ) {}

  // ─── Budget ───

  async createBudget(userId: string, dto: CreateBudgetDto): Promise<BudgetEntity> {
    const budget = this.budgetRepo.create({ userId, ...dto, currency: dto.currency || 'INR' });
    return this.budgetRepo.save(budget);
  }

  async getBudget(userId: string): Promise<BudgetEntity> {
    const budget = await this.budgetRepo.findOne({ where: { userId } });
    if (!budget) throw new NotFoundException('Budget not created yet');
    return budget;
  }

  async updateBudget(userId: string, totalBudget: number): Promise<BudgetEntity> {
    const budget = await this.getBudget(userId);
    budget.totalBudget = totalBudget;
    return this.budgetRepo.save(budget);
  }

  async getBudgetSummary(userId: string) {
    const budget = await this.getBudget(userId);
    const items = await this.budgetItemRepo.find({ where: { budgetId: budget.id } });
    const expenses = await this.expenseRepo.find({ where: { userId } });

    const byCategory: Record<string, { estimated: number; actual: number; paid: number }> = {};
    let totalEstimated = 0;
    let totalActual = 0;
    const totalPaid = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    items.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { estimated: 0, actual: 0, paid: 0 };
      }
      byCategory[item.category].estimated += item.estimatedCost;
      byCategory[item.category].actual += item.actualCost;
      byCategory[item.category].paid += item.paidAmount;
      totalEstimated += item.estimatedCost;
      totalActual += item.actualCost;
    });

    return {
      budget,
      items,
      summary: {
        totalBudget: budget.totalBudget,
        totalEstimated,
        totalActual,
        totalPaid,
        remaining: budget.totalBudget - totalPaid,
        overBudget: totalEstimated > budget.totalBudget,
        overBudgetBy: Math.max(0, totalEstimated - budget.totalBudget),
      },
      byCategory,
    };
  }

  async addBudgetItem(userId: string, dto: AddBudgetItemDto): Promise<BudgetItemEntity> {
    const budget = await this.getBudget(userId);
    const item = this.budgetItemRepo.create({ budgetId: budget.id, ...dto });
    const saved = await this.budgetItemRepo.save(item);

    // Recalculate totals
    await this.recalcBudget(budget.id);

    return saved;
  }

  async updateBudgetItem(itemId: string, dto: Partial<AddBudgetItemDto>): Promise<BudgetItemEntity> {
    const item = await this.budgetItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Budget item not found');
    Object.assign(item, dto);
    const saved = await this.budgetItemRepo.save(item);
    await this.recalcBudget(item.budgetId);
    return saved;
  }

  async deleteBudgetItem(itemId: string): Promise<void> {
    const item = await this.budgetItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Budget item not found');
    await this.budgetItemRepo.delete(itemId);
    await this.recalcBudget(item.budgetId);
  }

  private async recalcBudget(budgetId: string) {
    const items = await this.budgetItemRepo.find({ where: { budgetId } });
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId } });
    if (!budget) return;

    const expenses = await this.expenseRepo.find({ where: { userId: budget.userId } });
    budget.totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    budget.totalPending = items.reduce((s, i) => s + i.estimatedCost, 0) - budget.totalSpent;
    await this.budgetRepo.save(budget);
  }

  // ─── Expenses ───

  async addExpense(userId: string, dto: AddExpenseDto): Promise<ExpenseEntity> {
    const expense = this.expenseRepo.create({ userId, ...dto });
    const saved = await this.expenseRepo.save(expense);

    // Update budget item if linked
    if (dto.budgetItemId) {
      const item = await this.budgetItemRepo.findOne({ where: { id: dto.budgetItemId } });
      if (item) {
        item.paidAmount += dto.amount;
        item.actualCost = Math.max(item.actualCost, item.paidAmount);
        await this.budgetItemRepo.save(item);
        await this.recalcBudget(item.budgetId);
      }
    }

    return saved;
  }

  async getExpenses(userId: string, category?: string, page = 1, limit = 50) {
    const where: any = { userId };
    if (category) where.category = category;

    const skip = (page - 1) * limit;
    const [expenses, total] = await this.expenseRepo.findAndCount({
      where, order: { date: 'DESC' }, skip, take: limit,
    });

    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    return { expenses, total, totalAmount };
  }

  // ─── Loans ───

  async applyForLoan(userId: string, dto: ApplyLoanDto): Promise<LoanApplicationEntity> {
    const loan = this.loanRepo.create({
      userId,
      requestedAmount: dto.requestedAmount,
      tenureMonths: dto.tenureMonths,
      purpose: dto.purpose || 'Wedding expenses',
      status: LoanStatus.APPLIED,
    });
    return this.loanRepo.save(loan);
  }

  async getUserLoans(userId: string): Promise<LoanApplicationEntity[]> {
    return this.loanRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getLoan(id: string): Promise<LoanApplicationEntity> {
    const loan = await this.loanRepo.findOne({ where: { id } });
    if (!loan) throw new NotFoundException('Loan application not found');
    return loan;
  }

  async updateLoanStatus(id: string, status: LoanStatus, details?: Partial<LoanApplicationEntity>) {
    const loan = await this.getLoan(id);
    loan.status = status;
    if (details) Object.assign(loan, details);

    // Calculate EMI if approved
    if (status === LoanStatus.APPROVED && loan.approvedAmount && loan.interestRate && loan.tenureMonths) {
      const r = loan.interestRate / 100 / 12;
      const n = loan.tenureMonths;
      loan.emiAmount = Math.round((loan.approvedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    return this.loanRepo.save(loan);
  }

  // ─── Gift Registry ───

  async addGiftItem(userId: string, dto: AddGiftItemDto): Promise<GiftRegistryItemEntity> {
    const item = this.giftRepo.create({ userId, ...dto });
    return this.giftRepo.save(item);
  }

  async getGiftRegistry(userId: string): Promise<GiftRegistryItemEntity[]> {
    return this.giftRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getPublicGiftRegistry(userId: string): Promise<GiftRegistryItemEntity[]> {
    return this.giftRepo.find({
      where: { userId, status: GiftStatus.OPEN },
      order: { createdAt: 'DESC' },
    });
  }

  async reserveGift(giftId: string, reservedBy: string): Promise<GiftRegistryItemEntity> {
    const gift = await this.giftRepo.findOne({ where: { id: giftId } });
    if (!gift) throw new NotFoundException('Gift item not found');
    gift.status = GiftStatus.RESERVED;
    gift.reservedBy = reservedBy;
    return this.giftRepo.save(gift);
  }

  async markGiftPurchased(giftId: string, purchasedBy: string): Promise<GiftRegistryItemEntity> {
    const gift = await this.giftRepo.findOne({ where: { id: giftId } });
    if (!gift) throw new NotFoundException('Gift item not found');
    gift.status = GiftStatus.PURCHASED;
    gift.purchasedBy = purchasedBy;
    gift.fulfilledQuantity++;
    return this.giftRepo.save(gift);
  }

  async deleteGiftItem(giftId: string, userId: string): Promise<void> {
    await this.giftRepo.delete({ id: giftId, userId });
  }
}
