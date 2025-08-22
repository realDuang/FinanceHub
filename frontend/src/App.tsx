import { useState } from "react";
import { BarChart3, Wallet, TrendingUp } from "lucide-react";
import CashFlowAnalysis from "./pages/CashFlowAnalysis";
import BalanceSheet from "./pages/BalanceSheet";

type PageType = "cash-flow-analysis" | "balance-sheet";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("balance-sheet");

  const navigationItems = [
    {
      id: "balance-sheet" as const,
      name: "资产仪表板",
      icon: Wallet,
      description: "净资产管理 · 投资组合 · 财富增长",
      color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50",
    },
    {
      id: "cash-flow-analysis" as const,
      name: "现金流分析",
      icon: BarChart3,
      description: "收支趋势 · 消费模式 · 财务洞察",
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50",
    },
  ];

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "cash-flow-analysis":
        return <CashFlowAnalysis />;
      case "balance-sheet":
        return <BalanceSheet />;
      default:
        return <CashFlowAnalysis />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo 和主标题 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  FinanceHub
                </h1>
                <p className="text-sm text-gray-500 -mt-1">智能财务分析平台</p>
              </div>
            </div>

            {/* 导航标签页 */}
            <div className="flex bg-gray-100 rounded-xl p-1 space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`
                      relative flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform
                      ${
                        isActive
                          ? `${item.color} text-white shadow-lg scale-105`
                          : `text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-md`
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-white" : item.textColor
                      }`}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span
                        className={`text-xs ${
                          isActive ? "text-white/80" : "text-gray-400"
                        } hidden lg:block`}
                      >
                        {item.description}
                      </span>
                    </div>

                    {/* 活跃指示器 */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* 页面内容 */}
      <main>{renderCurrentPage()}</main>
    </div>
  );
}

export default App;
