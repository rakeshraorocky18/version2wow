import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanStatus, GiftStatus } from '../../../common/enums';

@Entity('budgets')
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'float' })
  totalBudget: number;

  @Column({ type: 'float', default: 0 })
  totalSpent: number;

  @Column({ type: 'float', default: 0 })
  totalPending: number;

  @Column({ nullable: true })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('budget_items')
export class BudgetItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  budgetId: string;

  @Column()
  category: string; // venue, catering, photography, decor, etc.

  @Column()
  itemName: string;

  @Column({ type: 'float' })
  estimatedCost: number;

  @Column({ type: 'float', default: 0 })
  actualCost: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  budgetItemId: string;

  @Column()
  category: string;

  @Column()
  description: string;

  @Column({ type: 'float' })
  amount: number;

  @Column()
  date: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('loan_applications')
export class LoanApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'float' })
  requestedAmount: number;

  @Column({ type: 'float', nullable: true })
  approvedAmount: number;

  @Column({ type: 'float', nullable: true })
  interestRate: number;

  @Column({ type: 'int', nullable: true })
  tenureMonths: number;

  @Column({ type: 'float', nullable: true })
  emiAmount: number;

  @Column({ type: 'varchar', default: LoanStatus.DRAFT })
  status: LoanStatus;

  @Column({ nullable: true })
  purpose: string;

  @Column({ nullable: true })
  lenderName: string;

  @Column({ nullable: true })
  applicationRef: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('gift_registry')
export class GiftRegistryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  itemName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'float', nullable: true })
  estimatedPrice: number;

  @Column({ nullable: true })
  productUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  fulfilledQuantity: number;

  @Column({ type: 'varchar', default: GiftStatus.OPEN })
  status: GiftStatus;

  @Column({ nullable: true })
  reservedBy: string;

  @Column({ nullable: true })
  purchasedBy: string;

  @Column({ nullable: true })
  thankYouSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
