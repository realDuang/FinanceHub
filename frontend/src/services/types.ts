import { IncomeExpenseType, PaymentMethod, TransactionType } from "./constants";

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}

// 交易记录相关接口
export interface TransactionDetailBase {
  transaction_time: string;
  category: TransactionType;
  amount: number;
  income_expense_type: IncomeExpenseType;
  payment_method?: PaymentMethod;
  counterparty?: string;
  item_name?: string;
  remarks?: string;
}

export interface TransactionDetail extends TransactionDetailBase {
  id: number;
  created_at: string;
  updated_at: string;
}

// 筛选查询接口
export interface TransactionFilterQuery {
  start_date?: string;
  end_date?: string;
  categories?: TransactionType[];
  income_expense_types?: IncomeExpenseType[];
  payment_methods?: PaymentMethod[];
  counterparties?: string[];
  min_amount?: number;
  max_amount?: number;
  keyword?: string;
  skip?: number;
  limit?: number;
  order_by?: "transaction_time" | "category" | "amount" | "income_expense_type" | "payment_method" | "counterparty" | "item_name" | "remarks";
  order_direction?: "asc" | "desc";
}

// 分页信息接口
export interface PaginationInfo {
  skip: number;
  limit: number;
  has_more: boolean;
}

// 筛选结果接口
export interface TransactionFilterResult {
  records: TransactionDetail[];
  total: number;
  filters_applied: string[];
  pagination: PaginationInfo;
}

// 财务聚合记录相关接口
export interface FinancialAggregationRecord {
  id: number;
  month_date: string;
  housing: number;
  dining: number;
  living: number;
  entertainment: number;
  transportation: number;
  travel: number;
  gifts: number;
  transactions: number;
  social_expenses: number;
  salary: number;
  balance: number;
  avg_consumption: number;
  recent_avg_consumption: number;
  created_at: string;
  updated_at: string;
}

// 财务记录查询接口
export interface FinancialQuery {
  skip?: number;
  limit?: number;
  order_by?: string;
  order_direction?: "asc" | "desc";
}
