import { useState, useEffect, useCallback } from "react";
import type {
  ApiOptions,
  UseApiReturn,
  FinancialRecordsOptions,
} from "./types";
import api, {
  getExpensePieData,
  getIncomeExpenseData,
  getMonthlyExpenseData,
  getTrendData,
  getOverviewStats,
  getRecentRecords,
  getLatestRecord,
} from "../services/api";

/**
 * 通用API请求Hook
 */
export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  dependencies: any[] = [],
  options: ApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, onSuccess, onError } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "请求失败";
        setError(errorMessage);
        onError?.(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, execute, refetch: execute };
}

/**
 * 财务记录Hook
 */
export function useFinancialRecords(options: FinancialRecordsOptions = {}) {
  const { skip = 0, limit = 100 } = options;

  return useApi(() => api.getRecords(skip, limit), [skip, limit]);
}

/**
 * 日期范围数据Hook
 */
export function useDateRangeData(
  startDate: string | null,
  endDate: string | null
) {
  return useApi(
    () => api.getRecordsByDateRange(startDate!, endDate!),
    [startDate, endDate],
    { immediate: !!(startDate && endDate) }
  );
}

/**
 * 类别趋势Hook
 */
export function useCategoryTrends(category: string | null) {
  return useApi(() => api.getCategoryTrends(category!), [category], {
    immediate: !!category,
  });
}

/**
 * 月度分解Hook
 */
export function useMonthlyBreakdown(monthDate: string | null) {
  return useApi(() => api.getMonthlyBreakdown(monthDate!), [monthDate], {
    immediate: !!monthDate,
  });
}

/**
 * 年度对比Hook
 */
export function useYearComparison() {
  return useApi(() => api.getYearComparison());
}

/**
 * 顶级支出类别Hook
 */
export function useTopExpenseCategories(limit: number = 5) {
  return useApi(() => api.getTopExpenseCategories(limit), [limit]);
}

/**
 * 结余趋势Hook
 */
export function useBalanceTrend() {
  return useApi(() => api.getBalanceTrend());
}

// === 组件专用API Hooks ===

/**
 * 支出饼图数据Hook (用于ExpensePieChart组件)
 */
export function useExpensePieData() {
  return useApi(() => getExpensePieData());
}

/**
 * 收入支出对比数据Hook (用于IncomeExpenseChart组件)
 */
export function useIncomeExpenseData(months: number = 12) {
  return useApi(() => getIncomeExpenseData(months), [months]);
}

/**
 * 月度支出分类数据Hook (用于MonthlyExpenseChart组件)
 */
export function useMonthlyExpenseData(months: number = 12) {
  return useApi(() => getMonthlyExpenseData(months), [months]);
}

/**
 * 趋势数据Hook (用于TrendChart组件)
 */
export function useTrendData(months: number = 12) {
  return useApi(() => getTrendData(months), [months]);
}

/**
 * 概览统计数据Hook (用于Overview组件)
 */
export function useOverviewStats() {
  return useApi(() => getOverviewStats());
}

/**
 * 最近记录Hook
 */
export function useRecentRecords(months: number = 12) {
  return useApi(() => getRecentRecords(months), [months]);
}

/**
 * 最新记录Hook
 */
export function useLatestRecord() {
  return useApi(() => getLatestRecord());
}

/**
 * 健康检查Hook
 */
export function useHealthCheck() {
  return useApi(() => api.healthCheck(), [], { immediate: false });
}
