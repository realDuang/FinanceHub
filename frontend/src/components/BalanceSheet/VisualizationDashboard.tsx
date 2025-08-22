import React from 'react';
import { PieChart, TrendingUp, BarChart3 } from 'lucide-react';
import { AssetItem, LiabilityItem, HistoricalData, AssetDistribution } from '../../pages/types';
import AssetDistributionChart from './AssetDistributionChart';
import NetWorthTrendChart from './NetWorthTrendChart';

interface VisualizationDashboardProps {
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  historicalData: HistoricalData[];
}

const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({ 
  assets, 
  liabilities, 
  historicalData 
}) => {
  const generateAssetDistribution = (): AssetDistribution[] => {
    const distribution: AssetDistribution[] = [];
    
    // 按类别分组资产
    const currentAssets = assets.filter(a => a.category === 'current');
    const nonCurrentAssets = assets.filter(a => a.category === 'non-current');
    
    const currentAssetsTotal = currentAssets.reduce((sum, a) => sum + a.value, 0);
    const nonCurrentAssetsTotal = nonCurrentAssets.reduce((sum, a) => sum + a.value, 0);
    
    if (currentAssetsTotal > 0) {
      distribution.push({
        name: '流动资产',
        value: currentAssetsTotal,
        color: '#10b981'
      });
    }
    
    if (nonCurrentAssetsTotal > 0) {
      distribution.push({
        name: '非流动资产',
        value: nonCurrentAssetsTotal,
        color: '#3b82f6'
      });
    }
    
    // 如果有负债，也显示在分布中
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
    if (totalLiabilities > 0) {
      distribution.push({
        name: '总负债',
        value: totalLiabilities,
        color: '#ef4444'
      });
    }
    
    return distribution;
  };

  const assetDistribution = generateAssetDistribution();
  const hasData = assets.length > 0 || liabilities.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">暂无数据可视化</h3>
        <p className="text-slate-500">添加资产和负债项目后，这里将显示精美的图表分析</p>
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
            <h2 className="text-xl font-semibold text-white">资产负债分布</h2>
          </div>
        </div>
        <div className="p-6">
          <AssetDistributionChart data={assetDistribution} />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {assetDistribution.map((item, index) => (
              <div key={index} className="text-center p-3 bg-slate-50 rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-2" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-sm font-medium text-slate-700">{item.name}</div>
                <div className="text-lg font-bold" style={{ color: item.color }}>
                  {new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY',
                    minimumFractionDigits: 0
                  }).format(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 净资产趋势图 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">净资产趋势</h2>
          </div>
        </div>
        <div className="p-6">
          <NetWorthTrendChart data={historicalData} />
          {historicalData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-700 mb-1">当前净资产</div>
                <div className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY',
                    minimumFractionDigits: 0
                  }).format(historicalData[historicalData.length - 1]?.netWorth || 0)}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-700 mb-1">最高净资产</div>
                <div className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY',
                    minimumFractionDigits: 0
                  }).format(Math.max(...historicalData.map(d => d.netWorth)))}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-700 mb-1">记录天数</div>
                <div className="text-xl font-bold text-purple-600">
                  {historicalData.length} 天
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizationDashboard;