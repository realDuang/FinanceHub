import React from "react";
import { BarChart3, PieChart, TrendingUp, Wallet } from "lucide-react";
import Overview from "../components/Overview";
import MonthlyExpenseChart from "../components/MonthlyExpenseChart";
import TrendChart from "../components/TrendChart";
import ExpensePieChart from "../components/ExpensePieChart";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import { useGetFinancialAggregationRecords } from "../hooks/useApi";

/**
 * 财务管理仪表板
 */
const Dashboard: React.FC = () => {
  const { data: financialData, loading } = useGetFinancialAggregationRecords();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  财务分析报表
                </h1>
                <p className="text-sm text-gray-600">个人收支流水分析</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>数据更新至 2024年12月</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 仪表板概览 */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">财务概览</h2>
          </div>
          <Overview financialData={financialData} loading={loading} />
        </div>

        {/* 图表区域 */}
        <div className="space-y-8">
          {/* 月度支出分析 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                月度支出分析
              </h3>
            </div>
            <MonthlyExpenseChart
              financialData={financialData}
              loading={loading}
            />
          </div>

          {/* 消费趋势分析 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                消费趋势分析
              </h3>
            </div>
            <TrendChart financialData={financialData} loading={loading} />
          </div>

          {/* 支出类别分布 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                支出类别分布
              </h3>
            </div>
            <ExpensePieChart financialData={financialData} loading={loading} />
          </div>

          {/* 收支对比 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">收支对比</h3>
            </div>
            <IncomeExpenseChart
              financialData={financialData}
              loading={loading}
            />
          </div>
        </div>

        {/* 数据说明 */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">报表说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">数据来源</h4>
              <p>
                基于2022年8月至2024年12月的个人收支流水记录，包含住房、餐饮、生活、娱乐等各类支出及收入数据。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">分析指标</h4>
              <p>
                支出类别聚合分析、近三月消费趋势、月度收支对比、支出类别分布等多维度财务分析。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
