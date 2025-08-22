import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { FinancialAggregationRecord } from '../../services/types';

export type TimeRange = 'all' | 'last3months' | string; // string 用于年份，如 '2023', '2024'

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  allData?: FinancialAggregationRecord[];
}

/**
 * 从数据中提取所有可用的年份
 */
function getAvailableYears(data?: FinancialAggregationRecord[]): number[] {
  if (!data || data.length === 0) {
    return [];
  }

  const years = new Set<number>();
  data.forEach(record => {
    const date = new Date(record.month_date);
    years.add(date.getFullYear());
  });

  return Array.from(years).sort((a, b) => b - a); // 降序排列
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange, allData }) => {
  const availableYears = getAvailableYears(allData);
  
  const options = [
    { value: 'all' as TimeRange, label: '总计' },
    { value: 'last3months' as TimeRange, label: '最近三个月' },
    ...availableYears.map(year => ({
      value: year.toString() as TimeRange,
      label: `${year}年`
    }))
  ];

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-gray-700">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm font-medium">时间范围:</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimeRangeSelector;
