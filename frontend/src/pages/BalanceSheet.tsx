import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  AssetItem,
  LiabilityItem,
  BalanceSheetData,
  FinancialRatios,
} from "./types";
import AddItemModal from "../components/BalanceSheet/AddItemModal";
import EditItemModal from "../components/BalanceSheet/EditItemModal";
import FinancialSummary from "../components/BalanceSheet/FinancialSummary";
import VisualizationDashboard from "../components/BalanceSheet/VisualizationDashboard";
import { HistoricalData } from "./types";

const BalanceSheet: React.FC = () => {
  const [data, setData] = useState<BalanceSheetData>({
    assets: [],
    liabilities: [],
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "asset" | "liability";
    item: AssetItem | LiabilityItem;
  } | null>(null);
  const [addType, setAddType] = useState<"asset" | "liability">("asset");
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);

  const calculateFinancialRatios = useCallback((): FinancialRatios => {
    const currentAssets = data.assets
      .filter((a) => a.category === "current")
      .reduce((sum, a) => sum + a.value, 0);
    const nonCurrentAssets = data.assets
      .filter((a) => a.category === "non-current")
      .reduce((sum, a) => sum + a.value, 0);
    const totalAssets = currentAssets + nonCurrentAssets;

    const currentLiabilities = data.liabilities
      .filter((l) => l.category === "current")
      .reduce((sum, l) => sum + l.value, 0);
    const nonCurrentLiabilities = data.liabilities
      .filter((l) => l.category === "non-current")
      .reduce((sum, l) => sum + l.value, 0);
    const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

    const netWorth = totalAssets - totalLiabilities;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const debtToEquityRatio = netWorth > 0 ? totalLiabilities / netWorth : 0;

    return {
      currentRatio,
      debtToEquityRatio,
      netWorth,
      totalAssets,
      totalLiabilities,
    };
  }, [data]);

  useEffect(() => {
    const savedData = localStorage.getItem("balance-sheet-data");
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      // 添加示例数据
      const sampleData: BalanceSheetData = {
        assets: [
          { id: "1", name: "银行存款", value: 50000, category: "current" },
          { id: "2", name: "投资账户", value: 120000, category: "current" },
          { id: "3", name: "房产", value: 800000, category: "non-current" },
          { id: "4", name: "汽车", value: 200000, category: "non-current" },
        ],
        liabilities: [
          { id: "1", name: "信用卡债务", value: 8000, category: "current" },
          { id: "2", name: "房贷", value: 450000, category: "non-current" },
          { id: "3", name: "车贷", value: 80000, category: "non-current" },
        ],
      };
      setData(sampleData);
      localStorage.setItem("balance-sheet-data", JSON.stringify(sampleData));
    }

    // 加载历史数据
    const savedHistoricalData = localStorage.getItem(
      "balance-sheet-historical"
    );
    if (savedHistoricalData) {
      setHistoricalData(JSON.parse(savedHistoricalData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("balance-sheet-data", JSON.stringify(data));

    // 每次数据变化时，记录历史数据（每天最多记录一次）
    const today = new Date().toISOString().split("T")[0];
    const ratios = calculateFinancialRatios();

    setHistoricalData((prev) => {
      const filtered = prev.filter((item) => !item.date.startsWith(today));
      const newData = [
        ...filtered,
        {
          date: today,
          netWorth: ratios.netWorth,
          totalAssets: ratios.totalAssets,
          totalLiabilities: ratios.totalLiabilities,
        },
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      localStorage.setItem("balance-sheet-historical", JSON.stringify(newData));
      return newData;
    });
  }, [data, calculateFinancialRatios]);

  const handleAddItem = (item: Omit<AssetItem | LiabilityItem, "id">) => {
    const newItem = { ...item, id: Date.now().toString() };

    if (addType === "asset") {
      setData((prev) => ({
        ...prev,
        assets: [...prev.assets, newItem as AssetItem],
      }));
    } else {
      setData((prev) => ({
        ...prev,
        liabilities: [...prev.liabilities, newItem as LiabilityItem],
      }));
    }
    setShowAddModal(false);
  };

  const handleEditItem = (updatedItem: AssetItem | LiabilityItem) => {
    if (!editingItem) return;

    if (editingItem.type === "asset") {
      setData((prev) => ({
        ...prev,
        assets: prev.assets.map((a) =>
          a.id === updatedItem.id ? (updatedItem as AssetItem) : a
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        liabilities: prev.liabilities.map((l) =>
          l.id === updatedItem.id ? (updatedItem as LiabilityItem) : l
        ),
      }));
    }
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (type: "asset" | "liability", id: string) => {
    if (type === "asset") {
      setData((prev) => ({
        ...prev,
        assets: prev.assets.filter((a) => a.id !== id),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        liabilities: prev.liabilities.filter((l) => l.id !== id),
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  };

  const ratios = calculateFinancialRatios();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题区域 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-slate-800">
              资产负债管理
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl">
            管理您的个人财务，追踪资产与负债，实现财富增长目标
          </p>
        </div>

        <FinancialSummary ratios={ratios} />

        <VisualizationDashboard
          assets={data.assets}
          liabilities={data.liabilities}
          historicalData={historicalData}
        />

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* 资产部分 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">资产</h2>
                </div>
                <button
                  onClick={() => {
                    setAddType("asset");
                    setShowAddModal(true);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                  流动资产
                  <span className="text-sm text-slate-500">(现金及等价物)</span>
                </h3>
                <div className="space-y-3">
                  {data.assets
                    .filter((asset) => asset.category === "current")
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div>
                          <span className="font-medium text-slate-700">
                            {asset.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(asset.value)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingItem({ type: "asset", item: asset });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem("asset", asset.id)
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                  非流动资产
                  <span className="text-sm text-slate-500">(长期投资)</span>
                </h3>
                <div className="space-y-3">
                  {data.assets
                    .filter((asset) => asset.category === "non-current")
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div>
                          <span className="font-medium text-slate-700">
                            {asset.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(asset.value)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingItem({ type: "asset", item: asset });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem("asset", asset.id)
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">
                    总资产
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(ratios.totalAssets)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 负债部分 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">负债</h2>
                </div>
                <button
                  onClick={() => {
                    setAddType("liability");
                    setShowAddModal(true);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                  流动负债
                  <span className="text-sm text-slate-500">(短期债务)</span>
                </h3>
                <div className="space-y-3">
                  {data.liabilities
                    .filter((liability) => liability.category === "current")
                    .map((liability) => (
                      <div
                        key={liability.id}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div>
                          <span className="font-medium text-slate-700">
                            {liability.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-red-600">
                            {formatCurrency(liability.value)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingItem({
                                  type: "liability",
                                  item: liability,
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem("liability", liability.id)
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                  非流动负债
                  <span className="text-sm text-slate-500">(长期债务)</span>
                </h3>
                <div className="space-y-3">
                  {data.liabilities
                    .filter((liability) => liability.category === "non-current")
                    .map((liability) => (
                      <div
                        key={liability.id}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div>
                          <span className="font-medium text-slate-700">
                            {liability.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-red-600">
                            {formatCurrency(liability.value)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingItem({
                                  type: "liability",
                                  item: liability,
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem("liability", liability.id)
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">
                    总负债
                  </span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(ratios.totalLiabilities)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 净资产汇总 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div
            className={`px-6 py-4 ${
              ratios.netWorth >= 0
                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                : "bg-gradient-to-r from-orange-500 to-red-600"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <PieChart className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                净资产 (所有者权益)
              </h2>
            </div>
          </div>
          <div className="p-6 text-center">
            <div
              className={`text-4xl font-bold mb-2 ${
                ratios.netWorth >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              {formatCurrency(ratios.netWorth)}
            </div>
            <p className="text-slate-600">
              {ratios.netWorth >= 0
                ? "恭喜！您的净资产为正值"
                : "需要关注：净资产为负值，建议优化财务结构"}
            </p>
          </div>
        </div>
      </div>

      {/* 模态框 */}
      {showAddModal && (
        <AddItemModal
          type={addType}
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && editingItem && (
        <EditItemModal
          type={editingItem.type}
          item={editingItem.item}
          onSave={handleEditItem}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default BalanceSheet;
