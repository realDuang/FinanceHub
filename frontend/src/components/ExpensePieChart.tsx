import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { financialData, expenseCategories } from '../interface/financialData';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensePieChart: React.FC = () => {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  // 计算最新月份各类别支出总额
  const latestRecord = financialData[financialData.length - 1];
  
  const categoryData = expenseCategories.map(category => ({
    ...category,
    value: Math.abs(latestRecord[category.key as keyof typeof latestRecord] as number)
  })).filter(item => item.value > 0);

  const data = {
    labels: categoryData.map(item => item.label),
    datasets: [
      {
        data: categoryData.map(item => item.value),
        backgroundColor: categoryData.map(item => item.color),
        borderColor: categoryData.map(item => item.color),
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '支出类别分布',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed as number;
            const total = categoryData.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '50%'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="h-80 w-full">
        <Chart ref={chartRef} type="doughnut" data={data} options={options} />
      </div>
    </div>
  );
};

export default ExpensePieChart;