import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { FinancialRatios } from '../../pages/types';

interface FinancialSummaryProps {
  ratios: FinancialRatios;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ ratios }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount);
  };

  const formatRatio = (ratio: number) => {
    return ratio.toFixed(2);
  };

  const getCurrentRatioStatus = () => {
    if (ratios.currentRatio >= 2) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    if (ratios.currentRatio >= 1) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
    return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle };
  };

  const getDebtRatioStatus = () => {
    if (ratios.debtToEquityRatio <= 0.3) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    if (ratios.debtToEquityRatio <= 0.6) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
    return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle };
  };

  const currentRatioStatus = getCurrentRatioStatus();
  const debtRatioStatus = getDebtRatioStatus();

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">财务健康分析</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${currentRatioStatus.bgColor}`}>
              <currentRatioStatus.icon className={`h-6 w-6 ${currentRatioStatus.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {formatRatio(ratios.currentRatio)}
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">流动比率</div>
            <div className={`text-xs px-3 py-1 rounded-full ${currentRatioStatus.bgColor} ${currentRatioStatus.color} font-medium`}>
              {ratios.currentRatio >= 2 ? '优秀' : ratios.currentRatio >= 1 ? '良好' : '需改善'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              流动资产 ÷ 流动负债
            </div>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${debtRatioStatus.bgColor}`}>
              <debtRatioStatus.icon className={`h-6 w-6 ${debtRatioStatus.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {ratios.netWorth > 0 ? formatRatio(ratios.debtToEquityRatio) : '∞'}
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">负债权益比</div>
            <div className={`text-xs px-3 py-1 rounded-full ${debtRatioStatus.bgColor} ${debtRatioStatus.color} font-medium`}>
              {ratios.debtToEquityRatio <= 0.3 ? '优秀' : ratios.debtToEquityRatio <= 0.6 ? '良好' : '需改善'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              总负债 ÷ 净资产
            </div>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${ratios.netWorth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-6 w-6 ${ratios.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className={`text-2xl font-bold mb-1 ${ratios.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((ratios.netWorth / ratios.totalAssets) * 100).toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">资产净值率</div>
            <div className={`text-xs px-3 py-1 rounded-full ${ratios.netWorth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} font-medium`}>
              {ratios.netWorth >= 0 ? '健康' : '风险'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              净资产 ÷ 总资产
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">总资产</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(ratios.totalAssets)}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">总负债</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(ratios.totalLiabilities)}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">净资产</div>
              <div className={`text-2xl font-bold ${ratios.netWorth >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(ratios.netWorth)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;