/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import type { ApiOptions, UseApiReturn } from "./types";
import api from "../services/api";

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
 * 日期范围数据Hook
 */
export function useGetFinancialAggregationRecords(
  startDate?: string | null,
  endDate?: string | null
) {
  return useApi(async () => {
    return await api.getFinancialAggregationRecords({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  }, [startDate, endDate]);
}

/**
 * 获取所有财务数据（用于计算日期范围）
 */
export function useGetAllFinancialRecords() {
  return useApi(
    async () => {
      return await api.getFinancialAggregationRecords({
        limit: 9999,
      });
    },
    [],
    { immediate: true }
  );
}

/**
 * 搜索交易详情Hook
 */
export function useSearchTransactionDetails(
  filterQuery: any = {},
  immediate: boolean = true
) {
  return useApi(
    async () => {
      return await api.searchTransactionDetails({
        ...filterQuery,
        limit: 99999,
      });
    },
    [JSON.stringify(filterQuery)],
    { immediate }
  );
}

/**
 * 健康检查Hook
 */
export function useHealthCheck() {
  return useApi(() => api.healthCheck(), [], { immediate: false });
}
