import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HistoricalData } from '../../pages/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface NetWorthTrendChartProps {
  data: HistoricalData[];
}

const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">暂无历史数据</div>
          <div className="text-sm">随着时间推移，这里将显示您的净资产变化趋势</div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: '总资产',
        data: data.map(item => item.totalAssets),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.2,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '总负债',
        data: data.map(item => item.totalLiabilities),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '净资产',
        data: data.map(item => item.netWorth),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.2,
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex;
            return new Date(data[dataIndex].date).toLocaleDateString('zh-CN');
          },
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e2e8f0',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e2e8f0',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          callback: function(value) {
            return formatCurrency(Number(value)).replace('¥', '¥');
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="h-80">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default NetWorthTrendChart;