import { Activity, DollarSign, TrendingUp } from "lucide-react";
import type { PortfolioOverview } from "../../services/types";

interface SummaryCardsProps {
  overview: PortfolioOverview;
}

const currencyFormatter = (currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const SummaryCards: React.FC<SummaryCardsProps> = ({ overview }) => {
  const fmt = currencyFormatter(overview.cash.currency || "USD");

  const cards = [
    {
      id: "market-value",
      title: "Total Market Value",
      value: fmt.format(overview.total_market_value),
      subValue: `Cost ${fmt.format(overview.total_cost_value)}`,
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      id: "overall-pnl",
      title: "Unrealized P&L",
      value: fmt.format(overview.total_pnl),
      subValue: percentFormatter.format(overview.total_pnl_ratio / 100 || 0),
      icon: <DollarSign className="w-5 h-5 text-white" />,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      id: "today-pnl",
      title: "Today's P&L",
      value: fmt.format(overview.today_pnl),
      subValue: percentFormatter.format(overview.today_pnl_ratio / 100 || 0),
      icon: <Activity className="w-5 h-5 text-white" />,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${card.gradient}`}
          >
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {card.value}
            </p>
            <p className="text-sm text-gray-400 mt-1">{card.subValue}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
