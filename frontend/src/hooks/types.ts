/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiOptions<T = any> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  refetch: (...args: any[]) => Promise<T>;
}

export interface FinancialRecordsOptions {
  skip?: number;
  limit?: number;
}
