export interface AssetItem {
  id: string;
  name: string;
  value: number;
  category: "current" | "non-current";
}

export interface LiabilityItem {
  id: string;
  name: string;
  value: number;
  category: "current" | "non-current";
}

export interface BalanceSheetData {
  assets: AssetItem[];
  liabilities: LiabilityItem[];
}

export interface FinancialRatios {
  currentRatio: number;
  debtToEquityRatio: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface HistoricalData {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface AssetDistribution {
  name: string;
  value: number;
  color: string;
}
