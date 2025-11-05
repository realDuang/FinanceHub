import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Chart } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { PortfolioEquityPoint } from "../../services/types";

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface EquityTrendChartProps {
  data: PortfolioEquityPoint[];
  loading: boolean;
  currency: string;
}

const EquityTrendChart: React.FC<EquityTrendChartProps> = ({ data, loading, currency }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-96">
        <span className="text-gray-500">{t("investment.equityTrendChart.loading")}</span>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-96">
        <span className="text-gray-500">{t("investment.equityTrendChart.empty")}</span>
      </div>
    );
  }

  const labels = data.map((point) => point.timestamp);
  const equitySeries = data.map((point) => point.equity);
  const pnlSeries = data.map((point) => point.pnl);

  const chartData = {
    labels,
    datasets: [
      {
        type: "line" as const,
        label: t("investment.equityTrendChart.equityLabel"),
        data: equitySeries,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        tension: 0.35,
        pointRadius: 0,
        fill: true,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: t("investment.equityTrendChart.pnlLabel"),
        data: pnlSeries,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        tension: 0.35,
        pointRadius: 0,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }),
    [currency, locale]
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: ${numberFormatter.format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          tooltipFormat: "yyyy-MM-dd",
          displayFormats: {
            day: "MMM dd",
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        position: "left",
        grid: {
          color: "rgba(148, 163, 184, 0.15)",
        },
        ticks: {
          callback: (value) => numberFormatter.format(value as number),
        },
      },
      y1: {
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => numberFormatter.format(value as number),
        },
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("investment.equityTrendChart.title")}
        </h3>
        <span className="text-sm text-gray-400">
          {t("investment.equityTrendChart.subtitle")}
        </span>
      </div>
      <div className="h-96">
        <Chart type="line" data={chartData} options={options} updateMode="resize" />
      </div>
    </div>
  );
};

export default EquityTrendChart;
