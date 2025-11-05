import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PortfolioPosition } from "../../services/types";

interface PositionsTableProps {
  positions: PortfolioPosition[];
  loading: boolean;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, loading }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const getCurrencyFormatter = useMemo(
    () => new Map<string, Intl.NumberFormat>(),
    [locale]
  );

  const formatCurrency = (value: number, currency: string) => {
    if (!getCurrencyFormatter.has(currency)) {
      getCurrencyFormatter.set(
        currency,
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        })
      );
    }

    return getCurrencyFormatter.get(currency)!.format(value);
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-64">
        <span className="text-gray-500">{t("investment.positions.loading")}</span>
      </div>
    );
  }

  if (!positions.length) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-64">
        <span className="text-gray-500">{t("investment.positions.empty")}</span>
      </div>
    );
  }

  const fallbackCurrency = positions[0]?.currency || "USD";

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("investment.positions.title")}
        </h3>
        <span className="text-sm text-gray-400">
          {t("investment.positions.count", { count: positions.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.symbol")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.name")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.quantity")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.cost")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.lastPrice")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.marketValue")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.unrealizedPnL")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.unrealizedPct")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.todayPnL")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("investment.positions.headers.todayPct")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {positions.map((position) => {
              const rowCurrency = position.currency || fallbackCurrency;
              return (
                <tr key={position.symbol} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {position.symbol}
                  </div>
                  <div className="text-xs text-gray-400">{position.market}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                  {position.name}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {numberFormatter.format(position.quantity)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatCurrency(position.cost_price, rowCurrency)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatCurrency(position.last_price, rowCurrency)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(position.market_value, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm font-semibold ${
                    position.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatCurrency(position.pnl, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.pnl_ratio >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {percentFormatter.format((position.pnl_ratio || 0) / 100)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.today_pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatCurrency(position.today_pnl, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.today_pnl_ratio >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {percentFormatter.format((position.today_pnl_ratio || 0) / 100)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionsTable;
