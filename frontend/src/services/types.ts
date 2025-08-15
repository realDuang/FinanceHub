// 类型定义
export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  type: "income" | "expense";
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface CategoryTrend {
  category: string;
  data: Array<{
    date: string;
    amount: number;
  }>;
}

export interface MonthlyBreakdown {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categories: Record<string, number>;
}

export interface YearComparison {
  years: number[];
  incomeData: number[];
  expenseData: number[];
  balanceData: number[];
}

export interface TopExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface BalanceTrendPoint {
  date: string;
  balance: number;
  cumulativeBalance: number;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}
