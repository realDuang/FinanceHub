import React from "react";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { FinancialAggregationRecord } from "../../services/types";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && changeType && (
            <div className="flex items-center mt-2">
              {changeType === "positive" ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  changeType === "positive" ? "text-green-600" : "text-red-600"
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface OverviewProps {
  financialData: FinancialAggregationRecord[] | null;
  loading: boolean;
}

const Overview: React.FC<OverviewProps> = ({ financialData, loading }) => {
  // 处理 loading 状态和空数据
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-center h-24">
              <div className="text-gray-500">加载中...</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!financialData || financialData.length < 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-center h-24">
              <div className="text-gray-500">暂无数据</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 计算统计数据
  // 计算总收入（所有月份的收入总和）
  const totalIncome = financialData.reduce((sum, record) => sum + record.salary, 0);

  // 计算总支出（所有月份的支出总和）
  const totalExpenses = financialData.reduce((sum, record) => {
    return sum + Math.abs(
      record.housing +
      record.dining +
      record.living +
      record.entertainment +
      record.transportation +
      record.travel +
      record.gifts
    );
  }, 0);

  // 计算总结余（总收入 - 总支出）
  const totalBalance = totalIncome - totalExpenses;

  // 计算均匀消费支出（平均每月支出）
  const avgMonthlyExpenses = totalExpenses / financialData.length;
  const avgMonthlyExpensesLastPeriod = financialData.length > 1 ? 
    financialData.slice(0, -1).reduce((sum, record) => {
      return sum + Math.abs(
        record.housing +
        record.dining +
        record.living +
        record.entertainment +
        record.transportation +
        record.travel +
        record.gifts
      );
    }, 0) / (financialData.length - 1) : 0;
  const avgExpenseChange = avgMonthlyExpensesLastPeriod > 0 ?
    (((avgMonthlyExpenses - avgMonthlyExpensesLastPeriod) / avgMonthlyExpensesLastPeriod) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="总收入"
        value={`¥${totalIncome.toLocaleString()}`}
        icon={<Wallet className="w-6 h-6" />}
      />
      <StatCard
        title="总支出"
        value={`¥${totalExpenses.toLocaleString()}`}
        icon={<CreditCard className="w-6 h-6" />}
      />
      <StatCard
        title="总结余"
        value={`¥${totalBalance.toLocaleString()}`}
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <StatCard
        title="均匀消费支出"
        value={`¥${avgMonthlyExpenses.toLocaleString()}`}
        change={`${avgExpenseChange}%`}
        changeType={parseFloat(avgExpenseChange) <= 0 ? "positive" : "negative"}
        icon={<TrendingDown className="w-6 h-6" />}
      />
    </div>
  );
};

export default Overview;
