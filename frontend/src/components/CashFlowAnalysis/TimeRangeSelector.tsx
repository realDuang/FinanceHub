import React, { useState } from "react";
import { CalendarDays, Calendar, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseCustomRange } from "../../utils/date-utils";

export type TimeRange = "all" | "last3months" | string; // string for years (e.g. '2023', '2024') or custom ranges (e.g. 'custom:2023-01:2023-12')

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  availableYears: number[];
  availableMonthRange: { minMonth: string; maxMonth: string } | null;
}

/**
 * Format custom range display text (year-month format)
 */
function formatCustomRangeLabel(
  startMonth: string,
  endMonth: string,
  t: (key: string) => string
): string {
  const [startYear, startMon] = startMonth.split("-");
  const [endYear, endMon] = endMonth.split("-");

  return `${startYear}${t('common.year')}${parseInt(startMon)}${t('common.month')} - ${endYear}${t('common.year')}${parseInt(
    endMon
  )}${t('common.month')}`;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  availableYears,
  availableMonthRange,
}) => {
  const { t } = useTranslation();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartMonth, setCustomStartMonth] = useState("");
  const [customEndMonth, setCustomEndMonth] = useState("");

  // Base options
  const baseOptions = [
    { value: "all" as TimeRange, label: t('common.total') },
    ...availableYears.map((year) => ({
      value: year.toString() as TimeRange,
      label: `${year}${t('common.year')}`,
    })),
  ];

  // Check if current value is custom range
  const isCustomRange = value.startsWith("custom:");
  const customRange = isCustomRange ? parseCustomRange(value) : null;

  // Handle selection change
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setShowCustomPicker(true);
      // Set default months to available data range
      if (availableMonthRange) {
        setCustomStartMonth(availableMonthRange.minMonth);
        setCustomEndMonth(availableMonthRange.maxMonth);
      }
    } else {
      setShowCustomPicker(false);
      onChange(selectedValue as TimeRange);
    }
  };

  // Apply custom month range
  const handleApplyCustomRange = () => {
    if (customStartMonth && customEndMonth) {
      const customValue = `custom:${customStartMonth}:${customEndMonth}`;
      onChange(customValue as TimeRange);
      setShowCustomPicker(false);
    }
  };

  // Cancel custom month selection
  const handleCancelCustomRange = () => {
    setShowCustomPicker(false);
    setCustomStartMonth("");
    setCustomEndMonth("");
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-gray-700">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm font-medium">{t('cashFlow.timeRange')}:</span>
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
          <option value="custom">{t('common.customRange')}</option>
        </select>

        {/* Custom month picker popup */}
        {showCustomPicker && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('common.selectMonthRange')}
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
                  {t('common.startMonth')}
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
                  {t('common.endMonth')}
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
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStartMonth || !customEndMonth}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display current custom range */}
      {isCustomRange && customRange && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            {formatCustomRangeLabel(
              customRange.startMonth,
              customRange.endMonth,
              t
            )}
          </span>
          <button
            onClick={() => onChange("all")}
            className="text-gray-400 hover:text-gray-600"
            title={t('common.clearCustomRange')}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;
