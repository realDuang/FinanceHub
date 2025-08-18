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
export function useGetFinancialAggregationRecords(options?: {
  startDate: string | null;
  endDate: string | null;
}) {
  const { startDate, endDate } = options || {};
  return useApi(async () => {
    let records = await api.getFinancialAggregationRecords();
    if (startDate || endDate) {
      records = records.filter((record) => {
        const recordDate = new Date(record.month_date);
        return (
          (!startDate || recordDate >= new Date(startDate)) &&
          (!endDate || recordDate <= new Date(endDate))
        );
      });
    }
    return records;
  }, [options]);
}

/**
 * 健康检查Hook
 */
export function useHealthCheck() {
  return useApi(() => api.healthCheck(), [], { immediate: false });
}
