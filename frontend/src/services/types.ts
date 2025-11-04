export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}

// 交易记录相关接口
export interface TransactionDetailBase {
  transaction_time: string;
  category: string;  // 改为字符串类型，接受中文值
  amount: number;
  income_expense_type: string;  // 改为字符串类型，接受中文值
  payment_method?: string;  // 改为字符串类型，接受中文值
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
  categories?: string[];  // 改为字符串数组
  income_expense_types?: string[];  // 改为字符串数组
  payment_methods?: string[];  // 改为字符串数组
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
  start_date?: string;
  end_date?: string;
}

export interface TransactionImportPayload {
  records: Array<{
    transaction_time: string;
    category: string;
    amount: string;
    income_expense_type: string;
    payment_method?: string;
    counterparty?: string;
    item_name?: string;
    remarks?: string;
  }>;
  enable_deduplication: boolean;
}

export interface ImportErrorDetail {
  row: number;
  reason: string;
  data?: Record<string, string>;
}

export interface ImportDuplicateDetail {
  row: number;
  transaction_time: string;
  amount: number;
  counterparty: string;
  item_name: string;
  reason: string;
}

export interface TransactionImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  skipped_count: number;
  duplicate_count: number;
  error_details: ImportErrorDetail[];
  duplicate_details: ImportDuplicateDetail[];
}

export interface PortfolioCashInfo {
  currency: string;
  total_assets: number;
  available_cash: number;
  buying_power: number;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  market: string;
  quantity: number;
  cost_price: number;
  last_price: number;
  market_value: number;
  pnl: number;
  pnl_ratio: number;
  today_pnl: number;
  today_pnl_ratio: number;
  currency: string;
  lot_size?: number | null;
}

export interface PortfolioEquityPoint {
  timestamp: string;
  equity: number;
  pnl: number;
}

export interface PortfolioOverview {
  account_id: string;
  source: "futu" | "mock";
  total_market_value: number;
  total_cost_value: number;
  total_pnl: number;
  total_pnl_ratio: number;
  today_pnl: number;
  today_pnl_ratio: number;
  update_time: string;
  cash: PortfolioCashInfo;
}

export interface PortfolioSnapshot {
  overview: PortfolioOverview;
  positions: PortfolioPosition[];
  equity_curve: PortfolioEquityPoint[];
}
