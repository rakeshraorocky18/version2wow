import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PieChart, CreditCard, Gift, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

type Tab = 'budget' | 'expenses' | 'loans' | 'gifts';

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  notes?: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remaining: number;
}

interface BudgetSummaryResponse {
  items: BudgetItem[];
  summary: BudgetSummary;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: string;
}

interface ExpensesResponse {
  expenses: ExpenseItem[];
  total: number;
  totalAmount: number;
}

interface LoanApplication {
  id: string;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate?: number;
  tenureMonths?: number;
  emiAmount?: number;
  status: string;
  purpose?: string;
  createdAt: string;
}

interface GiftRegistryItem {
  id: string;
  itemName: string;
  description?: string;
  category?: string;
  estimatedPrice?: number;
  quantity: number;
  fulfilledQuantity: number;
  status: string;
}

export default function Finance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);
  const [newBudgetTotal, setNewBudgetTotal] = useState('');
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: '',
    estimatedCost: '',
    notes: '',
  });
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    paymentMethod: '',
  });
  const [newLoan, setNewLoan] = useState({
    requestedAmount: '',
    tenureMonths: '',
    purpose: '',
  });
  const [newGift, setNewGift] = useState({
    itemName: '',
    description: '',
    category: '',
    estimatedPrice: '',
    quantity: '1',
  });

  const money = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

  const { data: budgetData, isLoading: isBudgetLoading } = useQuery<BudgetSummaryResponse | null>({
    queryKey: ['finance-budget'],
    queryFn: async () => {
      try {
        const { data } = await api.get<BudgetSummaryResponse>('/finance/budget');
        return data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const { data: expensesData, isLoading: isExpensesLoading } = useQuery<ExpensesResponse>({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      const { data } = await api.get<ExpensesResponse>('/finance/expenses');
      return data;
    },
  });

  const { data: loansData, isLoading: isLoansLoading } = useQuery<LoanApplication[]>({
    queryKey: ['finance-loans'],
    queryFn: async () => {
      const { data } = await api.get<LoanApplication[]>('/finance/loans');
      return data;
    },
  });

  const { data: giftsData, isLoading: isGiftsLoading } = useQuery<GiftRegistryItem[]>({
    queryKey: ['finance-gifts'],
    queryFn: async () => {
      const { data } = await api.get<GiftRegistryItem[]>('/finance/gifts');
      return data;
    },
  });

  const createBudget = useMutation({
    mutationFn: async () => {
      const totalBudget = Number(newBudgetTotal);
      if (!totalBudget || totalBudget <= 0) {
        throw new Error('Enter a valid budget amount');
      }

      const { data } = await api.post('/finance/budget', {
        totalBudget,
        currency: 'INR',
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Budget created');
      setShowCreateBudget(false);
      setNewBudgetTotal('');
      queryClient.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create budget';
      toast.error(message);
    },
  });

  const addBudgetItem = useMutation({
    mutationFn: async () => {
      const estimatedCost = Number(newItem.estimatedCost);
      if (!newItem.itemName.trim() || !newItem.category.trim() || !estimatedCost || estimatedCost <= 0) {
        throw new Error('Item name, category and estimated cost are required');
      }

      const { data } = await api.post('/finance/budget/items', {
        itemName: newItem.itemName.trim(),
        category: newItem.category.trim(),
        estimatedCost,
        notes: newItem.notes.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Budget item added');
      setShowAddItem(false);
      setNewItem({ itemName: '', category: '', estimatedCost: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to add budget item');
      toast.error(message);
    },
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      const amount = Number(newExpense.amount);
      if (!newExpense.category.trim() || !newExpense.description.trim() || !newExpense.date || !amount || amount <= 0) {
        throw new Error('Category, description, amount and date are required');
      }

      const { data } = await api.post('/finance/expenses', {
        category: newExpense.category.trim(),
        description: newExpense.description.trim(),
        amount,
        date: newExpense.date,
        paymentMethod: newExpense.paymentMethod.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Expense recorded');
      setShowAddExpense(false);
      setNewExpense({ category: '', description: '', amount: '', date: '', paymentMethod: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to record expense');
      toast.error(message);
    },
  });

  const applyLoan = useMutation({
    mutationFn: async () => {
      const requestedAmount = Number(newLoan.requestedAmount);
      const tenureMonths = Number(newLoan.tenureMonths);
      if (!requestedAmount || requestedAmount <= 0) {
        throw new Error('Enter a valid loan amount');
      }

      const { data } = await api.post('/finance/loans/apply', {
        requestedAmount,
        tenureMonths: tenureMonths > 0 ? tenureMonths : undefined,
        purpose: newLoan.purpose.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Loan application submitted');
      setShowLoanForm(false);
      setNewLoan({ requestedAmount: '', tenureMonths: '', purpose: '' });
      queryClient.invalidateQueries({ queryKey: ['finance-loans'] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to apply for loan');
      toast.error(message);
    },
  });

  const addGift = useMutation({
    mutationFn: async () => {
      const quantity = Number(newGift.quantity);
      const estimatedPrice = Number(newGift.estimatedPrice);
      if (!newGift.itemName.trim()) {
        throw new Error('Gift name is required');
      }
      if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be at least 1');
      }

      const { data } = await api.post('/finance/gifts', {
        itemName: newGift.itemName.trim(),
        description: newGift.description.trim() || undefined,
        category: newGift.category.trim() || undefined,
        estimatedPrice: estimatedPrice > 0 ? estimatedPrice : undefined,
        quantity,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Gift item added');
      setShowAddGift(false);
      setNewGift({ itemName: '', description: '', category: '', estimatedPrice: '', quantity: '1' });
      queryClient.invalidateQueries({ queryKey: ['finance-gifts'] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to add gift item');
      toast.error(message);
    },
  });

  const loanStatusClass = (status: string) => {
    if (status === 'approved' || status === 'disbursed') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    if (status === 'applied') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  const giftStatusClass = (status: string) => {
    if (status === 'purchased') return 'bg-green-100 text-green-700';
    if (status === 'reserved') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const tabs = [
    { key: 'budget', label: 'Budget', icon: PieChart },
    { key: 'expenses', label: 'Expenses', icon: CreditCard },
    { key: 'loans', label: 'Loans', icon: TrendingDown },
    { key: 'gifts', label: 'Gift Registry', icon: Gift },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Services</h1>
        <p className="text-gray-500 mt-1">Budget planning, expenses, loans & gift registry</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          {isBudgetLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500">Loading budget...</div>
          ) : !budgetData ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">Create Your Wedding Budget</h3>
              <p className="text-sm text-gray-500 mt-1">Set the total amount first, then add budget items.</p>

              {showCreateBudget ? (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                    placeholder="Total budget (e.g. 1200000)"
                    value={newBudgetTotal}
                    onChange={(e) => setNewBudgetTotal(e.target.value)}
                  />
                  <button
                    onClick={() => createBudget.mutate()}
                    disabled={createBudget.isPending}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
                  >
                    {createBudget.isPending ? 'Saving...' : 'Save Budget'}
                  </button>
                  <button
                    onClick={() => setShowCreateBudget(false)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateBudget(true)}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700"
                >
                  Set Budget
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{money(budgetData.summary.totalBudget)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">Spent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1 flex items-center gap-1"><TrendingUp size={20} /> {money(budgetData.summary.totalPaid)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-2xl font-bold text-green-600 mt-1 flex items-center gap-1"><TrendingDown size={20} /> {money(budgetData.summary.remaining)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Budget Items</h3>
                  <button
                    onClick={() => setShowAddItem((prev) => !prev)}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus size={16} /> {showAddItem ? 'Close' : 'Add Item'}
                  </button>
                </div>

                {showAddItem && (
                  <div className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={newItem.itemName}
                      onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Estimated cost"
                      value={newItem.estimatedCost}
                      onChange={(e) => setNewItem({ ...newItem, estimatedCost: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => addBudgetItem.mutate()}
                      disabled={addBudgetItem.isPending}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
                    >
                      {addBudgetItem.isPending ? 'Adding...' : 'Save Item'}
                    </button>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      className="md:col-span-4 border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                {budgetData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <PieChart className="mx-auto" size={40} />
                    <p className="mt-2">Add budget items like Venue, Catering, Photography, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {budgetData.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{money(item.estimatedCost)}</p>
                          {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Expense Tracker</h3>
            <button
              onClick={() => setShowAddExpense((prev) => !prev)}
              className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
            >
              <Plus size={16} /> {showAddExpense ? 'Close' : 'Record Expense'}
            </button>
          </div>

          {showAddExpense && (
            <div className="mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                placeholder="Category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={() => addExpense.mutate()}
                disabled={addExpense.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {addExpense.isPending ? 'Saving...' : 'Save Expense'}
              </button>
              <input
                type="text"
                placeholder="Payment method (optional)"
                value={newExpense.paymentMethod}
                onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                className="md:col-span-5 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div className="mb-4 text-sm text-gray-600">
            Total recorded: <span className="font-semibold text-gray-900">{money(expensesData?.totalAmount || 0)}</span>
          </div>

          {isExpensesLoading ? (
            <div className="text-gray-500">Loading expenses...</div>
          ) : !expensesData || expensesData.expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CreditCard className="mx-auto" size={40} />
              <p className="mt-2">No expenses recorded yet. Track every wedding payment here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expensesData.expenses.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-3 flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{money(expense.amount)}</p>
                    {expense.paymentMethod && <p className="text-xs text-gray-500">{expense.paymentMethod}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Wedding Loan Applications</h3>
                <p className="text-sm text-gray-500">Apply and track your loan request status</p>
              </div>
              <button
                onClick={() => setShowLoanForm((prev) => !prev)}
                className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
              >
                <Plus size={16} /> {showLoanForm ? 'Close' : 'Apply Loan'}
              </button>
            </div>

            {showLoanForm && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="number"
                  placeholder="Requested amount"
                  value={newLoan.requestedAmount}
                  onChange={(e) => setNewLoan({ ...newLoan, requestedAmount: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Tenure (months)"
                  value={newLoan.tenureMonths}
                  onChange={(e) => setNewLoan({ ...newLoan, tenureMonths: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Purpose (optional)"
                  value={newLoan.purpose}
                  onChange={(e) => setNewLoan({ ...newLoan, purpose: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={() => applyLoan.mutate()}
                  disabled={applyLoan.isPending}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
                >
                  {applyLoan.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">My Applications</h3>
            {isLoansLoading ? (
              <div className="text-gray-500">Loading applications...</div>
            ) : !loansData || loansData.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p>No loan applications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {loansData.map((loan) => (
                  <div key={loan.id} className="border border-gray-200 rounded-lg p-3 flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{money(loan.requestedAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {loan.tenureMonths ? `${loan.tenureMonths} months` : 'Tenure not set'}
                        {loan.purpose ? ` • ${loan.purpose}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(loan.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${loanStatusClass(loan.status)}`}>
                        {loan.status}
                      </span>
                      {loan.approvedAmount ? <p className="text-xs text-gray-600">Approved: {money(loan.approvedAmount)}</p> : null}
                      {loan.emiAmount ? <p className="text-xs text-gray-600">EMI: {money(loan.emiAmount)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gift Registry Tab */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Gift Registry</h3>
              <p className="text-sm text-gray-500 mt-1">Let your guests know what you'd love to receive</p>
            </div>
            <button
              onClick={() => setShowAddGift((prev) => !prev)}
              className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
            >
              <Plus size={16} /> {showAddGift ? 'Close' : 'Add Gift'}
            </button>
          </div>

          {showAddGift && (
            <div className="mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                placeholder="Gift name"
                value={newGift.itemName}
                onChange={(e) => setNewGift({ ...newGift, itemName: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Category"
                value={newGift.category}
                onChange={(e) => setNewGift({ ...newGift, category: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Estimated price"
                value={newGift.estimatedPrice}
                onChange={(e) => setNewGift({ ...newGift, estimatedPrice: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={newGift.quantity}
                onChange={(e) => setNewGift({ ...newGift, quantity: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={() => addGift.mutate()}
                disabled={addGift.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {addGift.isPending ? 'Saving...' : 'Save Gift'}
              </button>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newGift.description}
                onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                className="md:col-span-5 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          {isGiftsLoading ? (
            <div className="text-gray-500">Loading gift registry...</div>
          ) : !giftsData || giftsData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Gift className="mx-auto" size={40} />
              <p className="mt-2">Create your wish list and share with guests. They can reserve items to avoid duplicates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {giftsData.map((giftItem) => (
                <div key={giftItem.id} className="border border-gray-200 rounded-lg p-3 flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{giftItem.itemName}</p>
                    <p className="text-xs text-gray-500">
                      {giftItem.category || 'General'} • Qty {giftItem.fulfilledQuantity}/{giftItem.quantity}
                    </p>
                    {giftItem.description && <p className="text-xs text-gray-500 mt-1">{giftItem.description}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    {giftItem.estimatedPrice ? <p className="font-semibold text-gray-900">{money(giftItem.estimatedPrice)}</p> : null}
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${giftStatusClass(giftItem.status)}`}>
                      {giftItem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
