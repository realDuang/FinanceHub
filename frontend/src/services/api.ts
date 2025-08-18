/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from "./constants";
import type { FinancialAggregationRecord, RequestOptions } from "./types";

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

  // === 财务聚合录查询API ===

  /**
   * 获取所有财务记录（分页）- 返回聚合后的月度数据
   */
  async getRecords(
    skip: number = 0,
    limit: number = 100
  ): Promise<FinancialAggregationRecord[]> {
    return this.get<FinancialAggregationRecord[]>("/records", {
      skip,
      limit,
    });
  }

  /**
   * 根据日期范围获取财务记录
   */
  async getRecordsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<FinancialAggregationRecord[]> {
    return this.get<FinancialAggregationRecord[]>("/records/range", {
      start_date: startDate,
      end_date: endDate,
    });
  }
}

// 创建API实例
const api = new FinancialAPI();

// 导出常用方法
export const {
  // 财务记录
  getRecords,
  getRecordsByDateRange,
} = api;

export default api;
