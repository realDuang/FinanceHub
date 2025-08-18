import React from "react";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { FinancialAggregationRecord } from "../services/types";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
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
  const latestRecord = financialData[financialData.length - 1];
  const previousRecord = financialData[financialData.length - 2];

  const totalIncome = latestRecord.salary;
  const totalExpenses = Math.abs(
    latestRecord.housing +
      latestRecord.dining +
      latestRecord.living +
      latestRecord.entertainment +
      latestRecord.transportation +
      latestRecord.travel +
      latestRecord.gifts
  );

  const incomeChange = (
    ((latestRecord.salary - previousRecord.salary) / previousRecord.salary) *
    100
  ).toFixed(1);
  const expenseChange = (
    ((totalExpenses -
      Math.abs(
        previousRecord.housing +
          previousRecord.dining +
          previousRecord.living +
          previousRecord.entertainment +
          previousRecord.transportation +
          previousRecord.travel +
          previousRecord.gifts
      )) /
      Math.abs(
        previousRecord.housing +
          previousRecord.dining +
          previousRecord.living +
          previousRecord.entertainment +
          previousRecord.transportation +
          previousRecord.travel +
          previousRecord.gifts
      )) *
    100
  ).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="本月收入"
        value={`¥${totalIncome.toLocaleString()}`}
        change={`${incomeChange}%`}
        changeType={parseFloat(incomeChange) >= 0 ? "positive" : "negative"}
        icon={<Wallet className="w-6 h-6" />}
      />
      <StatCard
        title="本月支出"
        value={`¥${totalExpenses.toLocaleString()}`}
        change={`${expenseChange}%`}
        changeType={parseFloat(expenseChange) <= 0 ? "positive" : "negative"}
        icon={<CreditCard className="w-6 h-6" />}
      />
      <StatCard
        title="结余"
        value={`¥${latestRecord.balance.toLocaleString()}`}
        change={`${(
          ((latestRecord.balance - previousRecord.balance) /
            previousRecord.balance) *
          100
        ).toFixed(1)}%`}
        changeType={
          latestRecord.balance > previousRecord.balance
            ? "positive"
            : "negative"
        }
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <StatCard
        title="月均支出"
        value={`¥${Math.abs(latestRecord.avg_consumption).toLocaleString()}`}
        change={`${(
          ((Math.abs(latestRecord.avg_consumption) -
            Math.abs(previousRecord.avg_consumption)) /
            Math.abs(previousRecord.avg_consumption)) *
          100
        ).toFixed(1)}%`}
        changeType={
          Math.abs(latestRecord.avg_consumption) <=
          Math.abs(previousRecord.avg_consumption)
            ? "positive"
            : "negative"
        }
        icon={<TrendingDown className="w-6 h-6" />}
      />
    </div>
  );
};

export default Overview;
