import React, { useState, useMemo } from "react";
import { BarChart3, PieChart, TrendingUp, Wallet, Table } from "lucide-react";
import Overview from "../components/Overview";
import MonthlyExpenseChart from "../components/MonthlyExpenseChart";
import TrendChart from "../components/TrendChart";
import ExpensePieChart from "../components/ExpensePieChart";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import FinancialDataTable from "../components/FinancialDataTable";
import TimeRangeSelector, { TimeRange } from "../components/TimeRangeSelector";
import { useGetFinancialAggregationRecords, useGetAllFinancialRecords } from "../hooks/useApi";
import { getDateRangeFromTimeRange, formatDateRangeText, getLatestDataDate } from "../utils/date-utils";

/**
 * 财务管理仪表板
 */
const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  
  // 获取所有数据用于计算日期范围
  const { data: allData } = useGetAllFinancialRecords();
  
  // 根据时间范围计算日期
  const dateRange = useMemo(() => getDateRangeFromTimeRange(timeRange, allData || undefined), [timeRange, allData]);
  
  // 计算最新数据的截止时间
  const latestDataDate = useMemo(() => getLatestDataDate(allData || undefined), [allData]);
  
  const { data: financialData, loading } = useGetFinancialAggregationRecords(
    dateRange.startDate,
    dateRange.endDate
  );

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  };

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
              <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>数据范围: {formatDateRangeText(timeRange, allData || undefined)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 移动端时间范围选择器 */}
        <div className="mb-6 md:hidden">
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
        </div>

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

          {/* 财务数据明细表 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Table className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">财务数据明细</h3>
            </div>
            <FinancialDataTable
              data={financialData || []}
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
                基于个人收支流水记录，包含住房、餐饮、生活、娱乐等各类支出及收入数据。
              </p>
            </div>
            <div>
              <h4 className="font-medium ext-gray-900 mb-2">分析指标</h4>
              <p>
                支出类别聚合分析、近三月消费趋势、月度收支对比、支出类别分布等多维度财务分析。
              </p>
            </div>
          </div>
        </div>

        {/* 数据更新尾注 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            数据更新截止至：{latestDataDate || '数据加载中...'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
