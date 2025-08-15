import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { financialData } from '../interface/financialData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const IncomeExpenseChart: React.FC = () => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // 取最近12个月的数据
  const recentData = financialData.slice(-12);
  
  const months = recentData.map(record => {
    const date = new Date(record.date);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  });

  const expenses = recentData.map(record => {
    return Math.abs(
      record.housing + record.food + record.living + 
      record.entertainment + record.transportation + record.travel + 
      record.gifts
    );
  });

  const data = {
    labels: months,
    datasets: [
      {
        type: 'bar' as const,
        label: '收入',
        data: recentData.map(record => record.salary),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'bar' as const,
        label: '支出',
        data: expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'line' as const,
        label: '结余',
        data: recentData.map(record => record.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1'
      }
    ]
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '收支对比分析',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ¥${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return '¥' + (value as number).toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return '¥' + (value as number).toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="h-96 w-full">
        <Chart ref={chartRef} type="bar" data={data} options={options} />
      </div>
    </div>
  );
};

export default IncomeExpenseChart;