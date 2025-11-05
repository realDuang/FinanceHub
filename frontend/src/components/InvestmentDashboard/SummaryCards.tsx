import { useMemo } from "react";
import { Activity, DollarSign, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PortfolioOverview } from "../../services/types";

interface SummaryCardsProps {
  overview: PortfolioOverview;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ overview }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: overview.cash.currency || "USD",
        maximumFractionDigits: 2,
      }),
    [locale, overview.cash.currency]
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const cards = [
    {
      id: "market-value",
      title: t("investment.summaryCards.totalMarketValue"),
      value: currencyFormatter.format(overview.total_market_value),
      subValue: t("investment.summaryCards.cost", {
        value: currencyFormatter.format(overview.total_cost_value),
      }),
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      id: "overall-pnl",
      title: t("investment.summaryCards.unrealizedPnL"),
      value: currencyFormatter.format(overview.total_pnl),
      subValue: t("investment.summaryCards.pnlRatio", {
        value: percentFormatter.format((overview.total_pnl_ratio || 0) / 100),
      }),
      icon: <DollarSign className="w-5 h-5 text-white" />,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      id: "today-pnl",
      title: t("investment.summaryCards.todayPnL"),
      value: currencyFormatter.format(overview.today_pnl),
      subValue: t("investment.summaryCards.todayRatio", {
        value: percentFormatter.format((overview.today_pnl_ratio || 0) / 100),
      }),
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
