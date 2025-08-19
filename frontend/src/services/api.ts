/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from "./constants";
import type {
  FinancialAggregationRecord,
  FinancialQuery,
  RequestOptions,
  TransactionFilterQuery,
  TransactionFilterResult,
} from "./types";

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
    const searchParams = new URLSearchParams();

    // 处理查询参数，过滤掉undefined值
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 处理数组参数
          value.forEach((item) => {
            searchParams.append(key, String(item));
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

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

  // === 交易记录查询API ===

  /**
   * 根据多种条件筛选交易记录
   */
  async searchTransactionDetails(
    filterQuery: TransactionFilterQuery
  ): Promise<TransactionFilterResult> {
    return this.post<TransactionFilterResult>(
      "/transactions/search",
      filterQuery
    );
  }

  // === 财务聚合记录查询API ===

  /**
   * 获取财务聚合记录（分页）- 返回聚合后的月度数据
   */
  async getFinancialAggregationRecords(
    query: FinancialQuery = {}
  ): Promise<FinancialAggregationRecord[]> {
    const {
      skip = 0,
      limit = 999,
      order_by = "month_date",
      order_direction = "asc",
      start_date,
      end_date,
    } = query;

    return this.get<FinancialAggregationRecord[]>("/financial/records", {
      skip,
      limit,
      order_by,
      order_direction,
      start_date,
      end_date,
    });
  }

  // === 健康检查API ===

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get<{ status: string; message: string }>("/health");
  }
}

// 创建API实例
const api = new FinancialAPI();

// 导出常用方法
export const {
  // 交易记录
  searchTransactionDetails,
  // 财务记录
  getFinancialAggregationRecords,
  // 健康检查
  healthCheck,
} = api;

export default api;
