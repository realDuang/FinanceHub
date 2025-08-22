import React from 'react';
import { CalendarDays } from 'lucide-react';

export type TimeRange = 'last3months' | 'thisyear' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const options = [
    { value: 'last3months' as TimeRange, label: '最近三个月' },
    { value: 'thisyear' as TimeRange, label: '年初至今' },
    { value: 'all' as TimeRange, label: '总计' },
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
