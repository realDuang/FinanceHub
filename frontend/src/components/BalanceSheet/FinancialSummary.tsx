import React, { useMemo } from "react";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { FinancialRatios } from "../../interfaces";
import { useTranslation } from "react-i18next";

interface FinancialSummaryProps {
  ratios: FinancialRatios;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ ratios }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "CNY",
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const ratioFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale]
  );

  const formatCurrency = (amount: number) => currencyFormatter.format(amount);
  const formatRatio = (ratio: number) => ratioFormatter.format(ratio);

  const getCurrentRatioStatus = () => {
    if (ratios.currentRatio >= 2)
      return {
        status: "excellent",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle,
      };
    if (ratios.currentRatio >= 1)
      return {
        status: "good",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: TrendingUp,
      };
    return {
      status: "warning",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      icon: AlertCircle,
    };
  };

  const getDebtRatioStatus = () => {
    if (ratios.debtToEquityRatio <= 0.3)
      return {
        status: "excellent",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle,
      };
    if (ratios.debtToEquityRatio <= 0.6)
      return {
        status: "good",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: TrendingUp,
      };
    return {
      status: "warning",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      icon: AlertCircle,
    };
  };

  const currentRatioStatus = getCurrentRatioStatus();
  const debtRatioStatus = getDebtRatioStatus();

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            {t("balanceSheet.summary.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${currentRatioStatus.bgColor}`}
            >
              <currentRatioStatus.icon
                className={`h-6 w-6 ${currentRatioStatus.color}`}
              />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {formatRatio(ratios.currentRatio)}
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">
              {t("balanceSheet.summary.currentRatio.label")}
            </div>
            <div
              className={`text-xs px-3 py-1 rounded-full ${currentRatioStatus.bgColor} ${currentRatioStatus.color} font-medium`}
            >
              {t(
                `balanceSheet.summary.currentRatio.status.${currentRatioStatus.status}`
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {t("balanceSheet.summary.currentRatio.formula")}
            </div>
          </div>

          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${debtRatioStatus.bgColor}`}
            >
              <debtRatioStatus.icon
                className={`h-6 w-6 ${debtRatioStatus.color}`}
              />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {ratios.netWorth > 0
                ? formatRatio(ratios.debtToEquityRatio)
                : "∞"}
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">
              {t("balanceSheet.summary.debtRatio.label")}
            </div>
            <div
              className={`text-xs px-3 py-1 rounded-full ${debtRatioStatus.bgColor} ${debtRatioStatus.color} font-medium`}
            >
              {t(
                `balanceSheet.summary.debtRatio.status.${debtRatioStatus.status}`
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {t("balanceSheet.summary.debtRatio.formula")}
            </div>
          </div>

          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                ratios.netWorth >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <TrendingUp
                className={`h-6 w-6 ${
                  ratios.netWorth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
            <div
              className={`text-2xl font-bold mb-1 ${
                ratios.netWorth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {percentFormatter.format(
                ratios.totalAssets === 0
                  ? 0
                  : ratios.netWorth / ratios.totalAssets
              )}
            </div>
            <div className="text-sm font-medium text-slate-600 mb-2">
              {t("balanceSheet.summary.netWorth.label")}
            </div>
            <div
              className={`text-xs px-3 py-1 rounded-full ${
                ratios.netWorth >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              } font-medium`}
            >
              {ratios.netWorth >= 0
                ? t("balanceSheet.summary.netWorth.status.positive")
                : t("balanceSheet.summary.netWorth.status.negative")}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {t("balanceSheet.summary.netWorth.formula")}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                {t("balanceSheet.summary.totals.assets")}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(ratios.totalAssets)}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                {t("balanceSheet.summary.totals.liabilities")}
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(ratios.totalLiabilities)}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                {t("balanceSheet.summary.totals.netWorth")}
              </div>
              <div
                className={`text-2xl font-bold ${
                  ratios.netWorth >= 0 ? "text-green-600" : "text-orange-600"
                }`}
              >
                {formatCurrency(ratios.netWorth)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
