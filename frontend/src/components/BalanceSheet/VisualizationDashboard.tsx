import React from "react";
import { PieChart, BarChart3 } from "lucide-react";
import {
  AssetItem,
  AssetDistribution,
} from "../../pages/types";
import AssetDistributionChart from "./AssetDistributionChart";

interface VisualizationDashboardProps {
  assets: AssetItem[];
}

const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  assets,
}) => {
  const generateAssetDistribution = (): AssetDistribution[] => {
    const distribution: AssetDistribution[] = [];

    // 预定义颜色数组，用于为不同资产分配颜色
    const assetColors = [
      "#10b981", // 翠绿色
      "#3b82f6", // 蓝色
      "#f59e0b", // 橙色
      "#8b5cf6", // 紫色
      "#06b6d4", // 青色
      "#84cc16", // 柠檬绿
      "#f97316", // 深橙色
      "#6366f1", // 靛蓝色
      "#14b8a6", // 蓝绿色
      "#a855f7", // 紫罗兰色
    ];

    // 为每个具体的资产项目创建分布数据（不包含负债）
    assets.forEach((asset, index) => {
      if (asset.value > 0) {
        distribution.push({
          name: asset.name,
          value: asset.value,
          color: assetColors[index % assetColors.length],
        });
      }
    });

    return distribution;
  };

  const assetDistribution = generateAssetDistribution();
  const hasAssets = assets.length > 0;

  if (!hasAssets) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">
          暂无资产数据
        </h3>
        <p className="text-slate-500">
          添加资产项目后，这里将显示您的资产组合分布图表
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 资产分布图 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <PieChart className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">资产组合分布</h2>
          </div>
        </div>
        <div className="p-6">
          <AssetDistributionChart data={assetDistribution} />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assetDistribution.map((item, index) => (
              <div
                key={index}
                className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200"
              >
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-sm font-medium text-slate-700 mb-1 line-clamp-2">
                  {item.name}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: item.color }}
                >
                  {new Intl.NumberFormat("zh-CN", {
                    style: "currency",
                    currency: "CNY",
                    minimumFractionDigits: 0,
                  }).format(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationDashboard;
