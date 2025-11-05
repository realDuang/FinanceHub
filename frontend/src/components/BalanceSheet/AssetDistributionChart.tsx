import React, { useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { AssetDistribution } from "../../interfaces";
import { useTranslation } from "react-i18next";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetDistributionChartProps {
  data: AssetDistribution[];
}

const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({
  data,
}) => {
  const { t, i18n } = useTranslation();
  const chartRef = useRef<ChartJS<"doughnut">>(null);

  const locale = i18n.language === "zh-CN" ? "zh-CN" : "en-US";

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale]
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  // Compute aggregate value for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderColor: data.map((item) => item.color),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: data.length <= 6, // Hide legend when too many entries
        position: "bottom" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#374151",
        bodyColor: "#374151",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function (context) {
            const value = context.parsed as number;
            const percentage = total === 0 ? 0 : value / total;
            return t("balanceSheet.visualization.tooltip", {
              label: context.label,
              value: formatCurrency(value),
              percentage: percentFormatter.format(percentage),
            });
          },
        },
      },
    },
    cutout: "40%",
  };

  return (
    <div className="h-80">
      <Doughnut ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default AssetDistributionChart;
