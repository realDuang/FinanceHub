import type {
  RequestOptions,
  TopExpenseCategory,
  CategoryTrend,
  MonthlyBreakdown,
  YearComparison,
  BalanceTrendPoint,
} from "./types";

// 新增后端财务记录类型，对应数据库聚合后的结构
export interface BackendFinancialRecord {
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

const API_BASE_URL = `${
  import.meta.env.VITE_SERVER_HOST || "http://localhost"
}:${import.meta.env.VITE_SERVER_PORT || "8000"}/api/v1`;

class RequestAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString()
      ? `${endpoint}?${searchParams}`
      : endpoint;
    return this.request<T>(url);
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * 文件上传
   */
  async uploadFile<T = any>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  }
}

/**
 * 财务数据API客户端
 */
class FinancialAPI extends RequestAPI {
  constructor() {
    super();
  }

  // === 财务记录查询API ===

  /**
   * 获取所有财务记录（分页）- 返回聚合后的月度数据
   */
  async getRecords(
    skip: number = 0,
    limit: number = 100
  ): Promise<BackendFinancialRecord[]> {
    return this.get<BackendFinancialRecord[]>("/records", {
      skip,
      limit,
    });
  }

  /**
   * 获取最近N个月的财务记录
   */
  async getRecentRecords(
    months: number = 12
  ): Promise<BackendFinancialRecord[]> {
    return this.get<BackendFinancialRecord[]>("/records", {
      limit: months,
    });
  }

  /**
   * 获取最新的财务记录（用于Overview组件）
   */
  async getLatestRecord(): Promise<BackendFinancialRecord> {
    const records = await this.getRecentRecords(1);
    if (records.length === 0) {
      throw new Error("没有找到财务记录");
    }
    return records[0];
  }

  /**
   * 根据日期范围获取财务记录
   */
  async getRecordsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<BackendFinancialRecord[]> {
    return this.get<BackendFinancialRecord[]>("/records/range", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 获取支出饼图数据（用于ExpensePieChart组件）
   */
  async getExpensePieData(): Promise<{
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    const latestRecord = await this.getLatestRecord();
    const categories = [
      { key: "housing", label: "住房", amount: Math.abs(latestRecord.housing) },
      { key: "dining", label: "餐饮", amount: Math.abs(latestRecord.dining) },
      { key: "living", label: "生活", amount: Math.abs(latestRecord.living) },
      {
        key: "entertainment",
        label: "娱乐",
        amount: Math.abs(latestRecord.entertainment),
      },
      {
        key: "transportation",
        label: "交通",
        amount: Math.abs(latestRecord.transportation),
      },
      { key: "travel", label: "旅行", amount: Math.abs(latestRecord.travel) },
      { key: "gifts", label: "礼物", amount: Math.abs(latestRecord.gifts) },
      {
        key: "social_expenses",
        label: "人情",
        amount: Math.abs(latestRecord.social_expenses),
      },
    ].filter((item) => item.amount > 0);

    const totalExpense = categories.reduce((sum, cat) => sum + cat.amount, 0);

    return {
      categories: categories.map((cat) => ({
        category: cat.label,
        amount: cat.amount,
        percentage: (cat.amount / totalExpense) * 100,
      })),
    };
  }

  /**
   * 获取收入支出对比数据（用于IncomeExpenseChart组件）
   */
  async getIncomeExpenseData(months: number = 12): Promise<{
    labels: string[];
    incomeData: number[];
    expenseData: number[];
    balanceData: number[];
  }> {
    const records = await this.getRecentRecords(months);

    const labels = records.map((record) => {
      const date = new Date(record.month_date);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });

    const incomeData = records.map((record) => record.salary);

    const expenseData = records.map((record) =>
      Math.abs(
        record.housing +
          record.dining +
          record.living +
          record.entertainment +
          record.transportation +
          record.travel +
          record.gifts +
          record.social_expenses
      )
    );

    const balanceData = records.map((record) => record.balance);

    return { labels, incomeData, expenseData, balanceData };
  }

  /**
   * 获取月度支出分类数据（用于MonthlyExpenseChart组件）
   */
  async getMonthlyExpenseData(months: number = 12): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }> {
    const records = await this.getRecentRecords(months);

    const labels = records.map((record) => {
      const date = new Date(record.month_date);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });

    const categories = [
      { key: "housing", label: "住房", color: "#ef4444" },
      { key: "dining", label: "餐饮", color: "#f97316" },
      { key: "living", label: "生活", color: "#eab308" },
      { key: "entertainment", label: "娱乐", color: "#22c55e" },
      { key: "transportation", label: "交通", color: "#3b82f6" },
      { key: "travel", label: "旅行", color: "#8b5cf6" },
      { key: "gifts", label: "礼物", color: "#ec4899" },
      { key: "social_expenses", label: "人情", color: "#06b6d4" },
    ];

    const datasets = categories.map((category) => ({
      label: category.label,
      data: records.map((record) =>
        Math.abs(record[category.key as keyof BackendFinancialRecord] as number)
      ),
      backgroundColor: category.color,
    }));

    return { labels, datasets };
  }

  /**
   * 获取趋势数据（用于TrendChart组件）
   */
  async getTrendData(months: number = 12): Promise<{
    labels: string[];
    avgConsumptionData: number[];
    recentAvgData: number[];
    balanceData: number[];
  }> {
    const records = await this.getRecentRecords(months);

    const labels = records.map((record) => {
      const date = new Date(record.month_date);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });

    const avgConsumptionData = records.map((record) =>
      Math.abs(record.avg_consumption)
    );
    const recentAvgData = records.map((record) =>
      Math.abs(record.recent_avg_consumption)
    );
    const balanceData = records.map((record) => record.balance);

    return { labels, avgConsumptionData, recentAvgData, balanceData };
  }

  /**
   * 获取概览统计数据（用于Overview组件）
   */
  async getOverviewStats(): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    monthlyAverage: number;
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  }> {
    const [latestRecord, previousRecord] = await this.getRecentRecords(2);

    const totalIncome = latestRecord.salary;
    const totalExpense = Math.abs(
      latestRecord.housing +
        latestRecord.dining +
        latestRecord.living +
        latestRecord.entertainment +
        latestRecord.transportation +
        latestRecord.travel +
        latestRecord.gifts +
        latestRecord.social_expenses
    );
    const balance = latestRecord.balance;
    const monthlyAverage = latestRecord.avg_consumption;

    // 计算变化率
    let incomeChange = 0;
    let expenseChange = 0;
    let balanceChange = 0;

    if (previousRecord) {
      const prevIncome = previousRecord.salary;
      const prevExpense = Math.abs(
        previousRecord.housing +
          previousRecord.dining +
          previousRecord.living +
          previousRecord.entertainment +
          previousRecord.transportation +
          previousRecord.travel +
          previousRecord.gifts +
          previousRecord.social_expenses
      );
      const prevBalance = previousRecord.balance;

      incomeChange =
        prevIncome !== 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
      expenseChange =
        prevExpense !== 0
          ? ((totalExpense - prevExpense) / prevExpense) * 100
          : 0;
      balanceChange =
        prevBalance !== 0
          ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100
          : 0;
    }

    return {
      totalIncome,
      totalExpense,
      balance,
      monthlyAverage,
      incomeChange,
      expenseChange,
      balanceChange,
    };
  }

  // === 数据分析API ===

  /**
   * 获取类别趋势数据
   */
  async getCategoryTrends(category: string): Promise<CategoryTrend> {
    return this.get<CategoryTrend>(`/analysis/category-trends/${category}`);
  }

  /**
   * 获取月度收支分解
   */
  async getMonthlyBreakdown(monthDate: string): Promise<MonthlyBreakdown> {
    return this.get<MonthlyBreakdown>(
      `/analysis/monthly-breakdown/${monthDate}`
    );
  }

  /**
   * 获取年度对比分析
   */
  async getYearComparison(): Promise<YearComparison> {
    return this.get<YearComparison>("/analysis/year-comparison");
  }

  /**
   * 获取最高支出类别排名
   */
  async getTopExpenseCategories(
    limit: number = 5
  ): Promise<TopExpenseCategory[]> {
    return this.get<TopExpenseCategory[]>("/analysis/top-expenses", { limit });
  }

  /**
   * 获取结余趋势分析
   */
  async getBalanceTrend(): Promise<BalanceTrendPoint[]> {
    return this.get<BalanceTrendPoint[]>("/analysis/balance-trend");
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>("/health");
  }
}

// 创建API实例
const api = new FinancialAPI();

// 导出常用方法
export const {
  // 财务记录
  getRecords,
  getRecentRecords,
  getLatestRecord,
  getRecordsByDateRange,

  // 组件专用数据API
  getExpensePieData,
  getIncomeExpenseData,
  getMonthlyExpenseData,
  getTrendData,
  getOverviewStats,

  // 数据分析
  getCategoryTrends,
  getMonthlyBreakdown,
  getYearComparison,
  getTopExpenseCategories,
  getBalanceTrend,

  // 工具
  healthCheck,
} = api;

export default api;
