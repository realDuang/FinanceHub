import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
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

  const calculateFinancialRatios = (): FinancialRatios => {
    const currentAssets = data.assets
      .filter((a) => a.category === "current")
      .reduce((sum, a) => sum + a.value, 0);
    const nonCurrentAssets = data.assets
      .filter((a) => a.category === "non-current")
      .reduce((sum, l) => sum + l.value, 0);
    const totalAssets = currentAssets + nonCurrentAssets;

    const currentLiabilities = data.liabilities
      .filter((l) => l.category === "current")
      .reduce((sum, l) => sum + l.value, 0);
    const nonCurrentLiabilities = data.liabilities
      .filter((l) => l.category === "non-current")
      .reduce((sum, l) => sum + l.value, 0);
    const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

    const netWorth = totalAssets - totalLiabilities;
    const currentRatio =
      currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const debtToEquityRatio = netWorth > 0 ? totalLiabilities / netWorth : 0;

    return {
      currentRatio,
      debtToEquityRatio,
      netWorth,
      totalAssets,
      totalLiabilities,
    };
  };

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
            <h1 className="text-3xl font-bold text-slate-800">资产负债管理</h1>
          </div>
          <p className="text-slate-600 max-w-2xl">
            管理您的个人财务，追踪资产与负债，实现财富增长目标
          </p>
        </div>

        <FinancialSummary ratios={ratios} />

        <div className="mb-8">
          <VisualizationDashboard assets={data.assets} />
        </div>

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
