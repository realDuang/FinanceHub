import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Wallet } from "lucide-react";

const navigationItems = [
  {
    id: "balance-sheet",
    name: "资产仪表板",
    icon: Wallet,
    description: "净资产管理 · 投资组合 · 财富增长",
    color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
    textColor: "text-emerald-600",
    bgLight: "bg-emerald-50",
    path: "/balance-sheet",
  },
  {
    id: "cash-flow-analysis",
    name: "现金流分析",
    icon: BarChart3,
    description: "收支趋势 · 消费模式 · 财务洞察",
    color: "bg-gradient-to-r from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50",
    path: "/cash-flow-analysis",
  },
];

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex bg-gray-100 rounded-xl p-1 space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);

        return (
          <NavLink
            key={item.id}
            to={item.path}
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
          </NavLink>
        );
      })}
    </div>
  );
};

export default Navigation;
