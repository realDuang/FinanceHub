import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import SummaryCards from "../components/InvestmentDashboard/SummaryCards";
import CashSummaryCard from "../components/InvestmentDashboard/CashSummaryCard";
import PositionsTable from "../components/InvestmentDashboard/PositionsTable";
import EquityTrendChart from "../components/InvestmentDashboard/EquityTrendChart";
import { useInvestmentPortfolio } from "../hooks/useInvestmentPortfolio";

const InvestmentDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error, refetch } = useInvestmentPortfolio();

  const overview = data?.overview;
  const positions = data?.positions ?? [];
  const equityCurve = data?.equity_curve ?? [];

  const updatedAt = overview
    ? new Date(overview.update_time).toLocaleString(i18n.language)
    : "--";

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{t("investment.title")}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {t("investment.pageDescription")}
          </p>
          {overview && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span>
                {t("investment.account.label")} · {overview.account_id}
              </span>
              <span>
                {t("investment.dataSource.label")} · {overview.source.toUpperCase()}
              </span>
              <span>
                {t("investment.updatedAt.label")} · {updatedAt}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {overview ? (
        <div className="space-y-8">
          <SummaryCards overview={overview} />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <EquityTrendChart
                data={equityCurve}
                loading={loading}
                currency={overview.cash.currency || "USD"}
              />
            </div>
            <CashSummaryCard cash={overview.cash} />
          </div>

          <PositionsTable positions={positions} loading={loading} />
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-2xl p-10 text-center text-gray-500">
          {loading ? t("investment.loadingData") : t("investment.noData")}
        </div>
      )}
    </div>
  );
};

export default InvestmentDashboard;
