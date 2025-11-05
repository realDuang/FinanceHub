import React, { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { expenseCategories, getCategoryLabel } from "../../utils/chart-utils";
import { FinancialAggregationRecord } from "../../services/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyExpenseChartProps {
  financialData: FinancialAggregationRecord[] | null;
  loading: boolean;
}

const MonthlyExpenseChart: React.FC<MonthlyExpenseChartProps> = ({
  financialData,
  loading,
}) => {
  const chartRef = useRef<ChartJS<"bar">>(null);
  const { t } = useTranslation();

  // Handle loading state and empty data
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="h-96 w-full flex items-center justify-center">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!financialData || financialData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="h-96 w-full flex items-center justify-center">
          <div className="text-gray-500">{t('common.noData')}</div>
        </div>
      </div>
    );
  }

  // 准备数据：按月份和消费类别聚合
  const months = financialData.map((record) => {
    const date = new Date(record.month_date);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const datasets = expenseCategories.map((category) => ({
    label: getCategoryLabel(category.key, t),
    data: financialData.map(
      (record) => record[category.key as keyof typeof record] as number
    ),
    backgroundColor: category.color,
    borderColor: category.color,
    borderWidth: 1,
    borderRadius: 6,
    borderSkipped: false,
  }));

  const data = {
    labels: months,
    datasets,
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "按月份和消费类别聚合的支出金额",
        font: {
          size: 16,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ¥${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value) {
            return "¥" + (value as number).toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="h-96 w-full">
        <Chart ref={chartRef} type="bar" data={data} options={options} />
      </div>
    </div>
  );
};

export default MonthlyExpenseChart;
