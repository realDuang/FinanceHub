import type { PortfolioCashInfo } from "../../services/types";

interface CashSummaryCardProps {
  cash: PortfolioCashInfo;
}

const numbers = (currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

const CashSummaryCard: React.FC<CashSummaryCardProps> = ({ cash }) => {
  const fmt = numbers(cash.currency || "USD");

  const rows = [
    { label: "Total Assets", value: fmt.format(cash.total_assets) },
    { label: "Available Cash", value: fmt.format(cash.available_cash) },
    { label: "Buying Power", value: fmt.format(cash.buying_power) },
  ];

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Account Cash</h3>
        <span className="text-sm text-gray-400">Currency · {cash.currency}</span>
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
