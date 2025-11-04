import type { PortfolioPosition } from "../../services/types";

interface PositionsTableProps {
  positions: PortfolioPosition[];
  loading: boolean;
}

const currencyValue = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const numberValue = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const percentValue = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-64">
        <span className="text-gray-500">Loading positions...</span>
      </div>
    );
  }

  if (!positions.length) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-64">
        <span className="text-gray-500">No positions to display</span>
      </div>
    );
  }

  const fallbackCurrency = positions[0]?.currency || "USD";

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Current Positions</h3>
        <span className="text-sm text-gray-400">{positions.length} items</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unrealized P&L
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unrealized %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Today P&L
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Today %
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
                  {numberValue.format(position.quantity)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {currencyValue(position.cost_price, rowCurrency)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {currencyValue(position.last_price, rowCurrency)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {currencyValue(position.market_value, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm font-semibold ${
                    position.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {currencyValue(position.pnl, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.pnl_ratio >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {percentValue.format((position.pnl_ratio || 0) / 100)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.today_pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {currencyValue(position.today_pnl, rowCurrency)}
                </td>
                <td
                  className={`px-6 py-3 whitespace-nowrap text-right text-sm ${
                    position.today_pnl_ratio >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {percentValue.format((position.today_pnl_ratio || 0) / 100)}
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
