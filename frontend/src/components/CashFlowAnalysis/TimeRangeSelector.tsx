import React, { useState } from "react";
import { CalendarDays, Calendar, X } from "lucide-react";
import { parseCustomRange } from "../../utils/date-utils";

export type TimeRange = "all" | "last3months" | string; // string 用于年份(如 '2023', '2024')或自定义范围(如 'custom:2023-01:2023-12')

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  availableYears: number[];
  availableMonthRange: { minMonth: string; maxMonth: string } | null;
}

/**
 * 格式化自定义范围显示文本（年月格式）
 */
function formatCustomRangeLabel(startMonth: string, endMonth: string): string {
  const [startYear, startMon] = startMonth.split("-");
  const [endYear, endMon] = endMonth.split("-");

  return `${startYear}年${parseInt(startMon)}月 - ${endYear}年${parseInt(
    endMon
  )}月`;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  availableYears,
  availableMonthRange,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartMonth, setCustomStartMonth] = useState("");
  const [customEndMonth, setCustomEndMonth] = useState("");

  // 基础选项
  const baseOptions = [
    { value: "all" as TimeRange, label: "总计" },
    ...availableYears.map((year) => ({
      value: year.toString() as TimeRange,
      label: `${year}年`,
    })),
  ];

  // 检查当前值是否是自定义范围
  const isCustomRange = value.startsWith("custom:");
  const customRange = isCustomRange ? parseCustomRange(value) : null;

  // 处理选择变更
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setShowCustomPicker(true);
      // 设置默认月份为可用数据范围
      if (availableMonthRange) {
        setCustomStartMonth(availableMonthRange.minMonth);
        setCustomEndMonth(availableMonthRange.maxMonth);
      }
    } else {
      setShowCustomPicker(false);
      onChange(selectedValue as TimeRange);
    }
  };

  // 应用自定义月份范围
  const handleApplyCustomRange = () => {
    if (customStartMonth && customEndMonth) {
      const customValue = `custom:${customStartMonth}:${customEndMonth}`;
      onChange(customValue as TimeRange);
      setShowCustomPicker(false);
    }
  };

  // 取消自定义月份选择
  const handleCancelCustomRange = () => {
    setShowCustomPicker(false);
    setCustomStartMonth("");
    setCustomEndMonth("");
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-gray-700">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm font-medium">时间范围:</span>
      </div>

      <div className="relative">
        <select
          value={isCustomRange ? "custom" : value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
        >
          {baseOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="custom">自定义范围</option>
        </select>

        {/* 自定义月份选择弹窗 */}
        {showCustomPicker && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                选择月份范围
              </h3>
              <button
                onClick={handleCancelCustomRange}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  开始月份
                </label>
                <input
                  type="month"
                  value={customStartMonth}
                  onChange={(e) => setCustomStartMonth(e.target.value)}
                  min={availableMonthRange?.minMonth}
                  max={availableMonthRange?.maxMonth}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  结束月份
                </label>
                <input
                  type="month"
                  value={customEndMonth}
                  onChange={(e) => setCustomEndMonth(e.target.value)}
                  min={customStartMonth || availableMonthRange?.minMonth}
                  max={availableMonthRange?.maxMonth}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleCancelCustomRange}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStartMonth || !customEndMonth}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 显示当前自定义范围 */}
      {isCustomRange && customRange && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            {formatCustomRangeLabel(
              customRange.startMonth,
              customRange.endMonth
            )}
          </span>
          <button
            onClick={() => onChange("all")}
            className="text-gray-400 hover:text-gray-600"
            title="清除自定义范围"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;
