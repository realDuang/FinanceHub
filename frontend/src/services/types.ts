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
  order_by?: keyof TransactionDetailBase;
  order_direction?: "asc" | "desc";
}

// 财务聚合记录相关接口
export interface FinancialAggregationRecord {
  month_date: string;
  housing?: number;
  dining?: number;
  living?: number;
  entertainment?: number;
  transportation?: number;
  travel?: number;
  gifts?: number;
  transactions?: number;
  social_expenses?: number;
  salary?: number;
  balance?: number;
  avg_consumption?: number;
  recent_avg_consumption?: number;
}
