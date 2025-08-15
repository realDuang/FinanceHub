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
import { financialData, expenseCategories } from "../interface/financialData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyExpenseChart: React.FC = () => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // 准备数据：按月份和消费类别聚合
  const months = financialData.slice(-12).map((record) => {
    const date = new Date(record.date);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const datasets = expenseCategories.map((category) => ({
    label: category.label,
    data: financialData
      .slice(-12)
      .map((record) =>
        Math.abs(record[category.key as keyof typeof record] as number)
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
