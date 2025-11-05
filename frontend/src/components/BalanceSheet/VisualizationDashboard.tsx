import React, { useMemo } from "react";
import { PieChart, BarChart3 } from "lucide-react";
import type { AssetItem, AssetDistribution } from "../../interfaces";
import AssetDistributionChart from "./AssetDistributionChart";
import { useTranslation } from "react-i18next";

interface VisualizationDashboardProps {
  assets: AssetItem[];
}

const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  assets,
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 0,
      }),
    [locale]
  );

  const generateAssetDistribution = (): AssetDistribution[] => {
    const distribution: AssetDistribution[] = [];

    // Predefined color palette for asset segments
    const assetColors = [
      "#10b981", // emerald green
      "#3b82f6", // blue
      "#f59e0b", // orange
      "#8b5cf6", // purple
      "#06b6d4", // cyan
      "#84cc16", // lime
      "#f97316", // deep orange
      "#6366f1", // indigo
      "#14b8a6", // teal
      "#a855f7", // violet
    ];

    // Build distribution data for each asset item (liabilities excluded)
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
          {t("balanceSheet.visualization.noDataTitle")}
        </h3>
        <p className="text-slate-500">
          {t("balanceSheet.visualization.noDataDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Asset distribution */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <PieChart className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              {t("balanceSheet.visualization.distributionTitle")}
            </h2>
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
                  {currencyFormatter.format(item.value)}
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
