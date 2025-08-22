import React, { useState, useMemo } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Wallet,
  Table,
  FileText,
} from "lucide-react";
import Overview from "../components/CashFlowAnalysis/Overview";
import MonthlyExpenseChart from "../components/CashFlowAnalysis/MonthlyExpenseChart";
import TrendChart from "../components/CashFlowAnalysis/TrendChart";
import ExpensePieChart from "../components/CashFlowAnalysis/ExpensePieChart";
import IncomeExpenseChart from "../components/CashFlowAnalysis/IncomeExpenseChart";
import FinancialDataTable from "../components/CashFlowAnalysis/FinancialDataTable";
import TransactionDetailTable from "../components/CashFlowAnalysis/TransactionDetailTable";
import TimeRangeSelector, { TimeRange } from "../components/CashFlowAnalysis/TimeRangeSelector";
import {
  useGetFinancialAggregationRecords,
  useGetAllFinancialRecords,
  useSearchTransactionDetails,
} from "../hooks/useApi";
import {
  getDateRangeFromTimeRange,
  formatDateRangeText,
  getLatestDataDate,
} from "../utils/date-utils";

/**
 * 财务管理仪表板
 */
const CashFlowAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">(
    "overview"
  );

  // 获取所有数据用于计算日期范围
  const { data: allData } = useGetAllFinancialRecords();

  // 根据时间范围计算日期
  const dateRange = useMemo(
    () => getDateRangeFromTimeRange(timeRange, allData || undefined),
    [timeRange, allData]
  );

  // 计算最新数据的截止时间
  const latestDataDate = useMemo(
    () => getLatestDataDate(allData || undefined),
    [allData]
  );

  const { data: financialData, loading } = useGetFinancialAggregationRecords(
    dateRange.startDate,
    dateRange.endDate
  );

  // 获取交易详情数据
  const { data: transactionData, loading: transactionLoading } =
    useSearchTransactionDetails({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      limit: 99999,
      order_by: "transaction_time",
      order_direction: "asc",  // 修改为增序排列
    });

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和控制区域 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">现金流分析</h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>数据范围: {formatDateRangeText(timeRange, allData || undefined)}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <TimeRangeSelector
                value={timeRange}
                onChange={handleTimeRangeChange}
                allData={allData || undefined}
              />
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>财务概览</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "transactions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>交易明细</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab 内容区域 */}
        {activeTab === "overview" && (
          <>
            {/* 仪表板概览 */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  财务概览
                </h2>
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
                <ExpensePieChart
                  financialData={financialData}
                  loading={loading}
                />
              </div>

              {/* 收支对比 */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    收支对比
                  </h3>
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    财务数据明细
                  </h3>
                </div>
                <FinancialDataTable
                  data={financialData || []}
                  loading={loading}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "transactions" && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                交易详情明细
              </h2>
            </div>
            <TransactionDetailTable
              data={transactionData?.records || []}
              loading={transactionLoading}
            />
          </div>
        )}

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
            数据更新截止至：{latestDataDate || "数据加载中..."}
          </p>
        </div>
      </main>
    </div>
  );
};

export default CashFlowAnalysis;
