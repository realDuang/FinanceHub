import type {
  RequestOptions,
  PaginatedResponse,
  FinancialRecord,
  SummaryData,
  TopExpenseCategory,
  CategoryTrend,
  MonthlyBreakdown,
  YearComparison,
  BalanceTrendPoint,
} from "./types";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_HOST || "http://localhost"}:${import.meta.env.VITE_SERVER_HOST || "8000"}/api/v1`;

/**
 * 财务数据API客户端
 */
class FinancialAPI {
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

  // === 财务记录查询API ===

  /**
   * 获取所有财务记录（分页）
   */
  async getRecords(
    skip: number = 0,
    limit: number = 100
  ): Promise<PaginatedResponse<FinancialRecord>> {
    return this.get<PaginatedResponse<FinancialRecord>>("/records", {
      skip,
      limit,
    });
  }

  /**
   * 根据年份获取财务记录
   */
  async getRecordsByYear(year: number): Promise<FinancialRecord[]> {
    return this.get<FinancialRecord[]>(`/records/year/${year}`);
  }

  /**
   * 根据日期范围获取财务记录
   */
  async getRecordsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<FinancialRecord[]> {
    return this.get<FinancialRecord[]>("/records/range", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 获取汇总统计
   */
  async getSummary(): Promise<SummaryData> {
    return this.get<SummaryData>("/summary");
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
  getRecordsByYear,
  getRecordsByDateRange,
  getSummary,

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
