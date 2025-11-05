import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PortfolioCashInfo } from "../../services/types";

interface CashSummaryCardProps {
  cash: PortfolioCashInfo;
}

const CashSummaryCard: React.FC<CashSummaryCardProps> = ({ cash }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: cash.currency || "USD",
        maximumFractionDigits: 2,
      }),
    [cash.currency, locale]
  );

  const rows = [
    {
      label: t("investment.cashCard.totalAssets"),
      value: formatter.format(cash.total_assets),
    },
    {
      label: t("investment.cashCard.availableCash"),
      value: formatter.format(cash.available_cash),
    },
    {
      label: t("investment.cashCard.buyingPower"),
      value: formatter.format(cash.buying_power),
    },
  ];

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("investment.cashCard.title")}
        </h3>
        <span className="text-sm text-gray-400">
          {t("investment.cashCard.currency")} · {cash.currency}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-500">{row.label}</span>
            <span className="text-base font-semibold text-gray-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashSummaryCard;
