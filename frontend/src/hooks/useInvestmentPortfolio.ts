import { useCallback, useEffect, useState } from "react";
import futuPortfolioService from "../services/futuPortfolioService";
import type { PortfolioSnapshot } from "../services/types";

export function useInvestmentPortfolio() {
  const [data, setData] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await futuPortfolioService.getSnapshot();
      setData(snapshot);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    data,
    loading,
    error,
    refetch: fetchSnapshot,
  };
}
