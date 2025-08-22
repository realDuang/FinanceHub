import { useState, useEffect } from 'react';
import { AssetItem, LiabilityItem, BalanceSheetData } from '../pages/types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// 资产相关 API
export const useAssets = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/balance-sheet/assets`);
      if (!response.ok) throw new Error('获取资产数据失败');
      const data = await response.json();
      setAssets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const createAsset = async (asset: Omit<AssetItem, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error('创建资产失败');
      const newAsset = await response.json();
      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '创建资产失败');
    }
  };

  const updateAsset = async (id: number, asset: Partial<AssetItem>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error('更新资产失败');
      const updatedAsset = await response.json();
      setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));
      return updatedAsset;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '更新资产失败');
    }
  };

  const deleteAsset = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/assets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除资产失败');
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '删除资产失败');
    }
  };

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};

// 负债相关 API
export const useLiabilities = () => {
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiabilities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/balance-sheet/liabilities`);
      if (!response.ok) throw new Error('获取负债数据失败');
      const data = await response.json();
      setLiabilities(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiabilities();
  }, []);

  const createLiability = async (liability: Omit<LiabilityItem, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liability),
      });
      if (!response.ok) throw new Error('创建负债失败');
      const newLiability = await response.json();
      setLiabilities(prev => [newLiability, ...prev]);
      return newLiability;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '创建负债失败');
    }
  };

  const updateLiability = async (id: number, liability: Partial<LiabilityItem>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/liabilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liability),
      });
      if (!response.ok) throw new Error('更新负债失败');
      const updatedLiability = await response.json();
      setLiabilities(prev => prev.map(l => l.id === id ? updatedLiability : l));
      return updatedLiability;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '更新负债失败');
    }
  };

  const deleteLiability = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balance-sheet/liabilities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除负债失败');
      setLiabilities(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '删除负债失败');
    }
  };

  return {
    liabilities,
    loading,
    error,
    refetch: fetchLiabilities,
    createLiability,
    updateLiability,
    deleteLiability,
  };
};

// 完整资产负债表数据
export const useBalanceSheetData = () => {
  const [data, setData] = useState<BalanceSheetData>({ assets: [], liabilities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceSheetData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/balance-sheet/data`);
      if (!response.ok) throw new Error('获取资产负债表数据失败');
      const balanceSheetData = await response.json();
      setData(balanceSheetData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheetData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchBalanceSheetData,
  };
};
