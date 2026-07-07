import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import {
  CreateBudgetDto, AddBudgetItemDto, AddExpenseDto,
  ApplyLoanDto, AddGiftItemDto,
} from './dto/finance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoanStatus } from '../../common/enums';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─── Budget ───

  @Post('budget')
  @ApiOperation({ summary: 'Create wedding budget' })
  async createBudget(@Req() req: any, @Body() dto: CreateBudgetDto) {
    return this.financeService.createBudget(req.user.id, dto);
  }

  @Get('budget')
  @ApiOperation({ summary: 'Get my budget with summary' })
  async getBudgetSummary(@Req() req: any) {
    return this.financeService.getBudgetSummary(req.user.id);
  }

  @Put('budget')
  @ApiOperation({ summary: 'Update total budget amount' })
  async updateBudget(@Req() req: any, @Body('totalBudget') totalBudget: number) {
    return this.financeService.updateBudget(req.user.id, totalBudget);
  }

  @Post('budget/items')
  @ApiOperation({ summary: 'Add a budget line item' })
  async addBudgetItem(@Req() req: any, @Body() dto: AddBudgetItemDto) {
    return this.financeService.addBudgetItem(req.user.id, dto);
  }

  @Put('budget/items/:id')
  @ApiOperation({ summary: 'Update a budget item' })
  async updateBudgetItem(@Param('id') id: string, @Body() dto: Partial<AddBudgetItemDto>) {
    return this.financeService.updateBudgetItem(id, dto);
  }

  @Delete('budget/items/:id')
  @ApiOperation({ summary: 'Delete a budget item' })
  async deleteBudgetItem(@Param('id') id: string) {
    return this.financeService.deleteBudgetItem(id);
  }

  // ─── Expenses ───

  @Post('expenses')
  @ApiOperation({ summary: 'Record an expense' })
  async addExpense(@Req() req: any, @Body() dto: AddExpenseDto) {
    return this.financeService.addExpense(req.user.id, dto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses' })
  async getExpenses(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.financeService.getExpenses(req.user.id, category, page, limit);
  }

  // ─── Loans ───

  @Post('loans/apply')
  @ApiOperation({ summary: 'Apply for a wedding loan' })
  async applyLoan(@Req() req: any, @Body() dto: ApplyLoanDto) {
    return this.financeService.applyForLoan(req.user.id, dto);
  }

  @Get('loans')
  @ApiOperation({ summary: 'Get my loan applications' })
  async getLoans(@Req() req: any) {
    return this.financeService.getUserLoans(req.user.id);
  }

  @Get('loans/:id')
  @ApiOperation({ summary: 'Get loan details' })
  async getLoan(@Param('id') id: string) {
    return this.financeService.getLoan(id);
  }

  @Put('loans/:id/status')
  @ApiOperation({ summary: 'Update loan status (admin)' })
  async updateLoanStatus(
    @Param('id') id: string,
    @Body('status') status: LoanStatus,
    @Body() details: Partial<any>,
  ) {
    return this.financeService.updateLoanStatus(id, status, details);
  }

  // ─── Gift Registry ───

  @Post('gifts')
  @ApiOperation({ summary: 'Add item to gift registry' })
  async addGift(@Req() req: any, @Body() dto: AddGiftItemDto) {
    return this.financeService.addGiftItem(req.user.id, dto);
  }

  @Get('gifts')
  @ApiOperation({ summary: 'Get my gift registry' })
  async getGifts(@Req() req: any) {
    return this.financeService.getGiftRegistry(req.user.id);
  }

  @Get('gifts/public/:userId')
  @ApiOperation({ summary: 'View public gift registry for a couple' })
  async getPublicGifts(@Param('userId') userId: string) {
    return this.financeService.getPublicGiftRegistry(userId);
  }

  @Put('gifts/:id/reserve')
  @ApiOperation({ summary: 'Reserve a gift' })
  async reserveGift(@Param('id') id: string, @Req() req: any) {
    return this.financeService.reserveGift(id, req.user.id);
  }

  @Put('gifts/:id/purchased')
  @ApiOperation({ summary: 'Mark gift as purchased' })
  async markPurchased(@Param('id') id: string, @Req() req: any) {
    return this.financeService.markGiftPurchased(id, req.user.id);
  }

  @Delete('gifts/:id')
  @ApiOperation({ summary: 'Remove gift from registry' })
  async deleteGift(@Param('id') id: string, @Req() req: any) {
    return this.financeService.deleteGiftItem(id, req.user.id);
  }
}
