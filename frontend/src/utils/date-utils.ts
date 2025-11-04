import type { TimeRange } from "../components/CashFlowAnalysis/TimeRangeSelector";
import type { FinancialAggregationRecord } from "../services/types";

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

/**
 * 安全地解析月份日期字符串
 * 处理多种日期格式：ISO字符串 "2024-12-01T00:00:00" 或旧格式 "2024/12/1"
 */
export function parseDate(monthDate: string): Date {
  // 如果是 ISO 字符串格式，直接解析
  if (monthDate.includes("T") || monthDate.includes("-")) {
    return new Date(monthDate);
  }
  // 如果是旧格式 "2024/12/1"，转换为标准格式
  return new Date(monthDate.replace(/\//g, "-"));
}

/**
 * 根据时间范围类型计算开始和结束日期
 */
export function getDateRangeFromTimeRange(timeRange: TimeRange): DateRange {
  if (timeRange === "all") {
    // 总计 - 不设置日期范围
    return {
      startDate: null,
      endDate: null,
    };
  } else if (timeRange.startsWith("custom:")) {
    // 检查是否是自定义范围
    const parts = timeRange.split(":");
    if (parts.length === 3) {
      const startMonth = parts[1]; // 格式: YYYY-MM
      const endMonth = parts[2]; // 格式: YYYY-MM

      // 将年月转换为日期范围
      const [startYear, startMon] = startMonth.split("-").map(Number);
      const [endYear, endMon] = endMonth.split("-").map(Number);

      // 开始日期是该月的第一天
      const startDate = `${startYear}-${String(startMon).padStart(2, "0")}-01`;

      // 结束日期是该月的最后一天
      const endDate = new Date(endYear, endMon, 0); // 0 表示上个月的最后一天，即该月的最后一天
      const endDateStr = `${endYear}-${String(endMon).padStart(
        2,
        "0"
      )}-${String(endDate.getDate()).padStart(2, "0")}`;

      return {
        startDate: startDate,
        endDate: endDateStr,
      };
    }
  } else {
    // 检查是否是年份（数字字符串）
    const year = parseInt(timeRange);
    if (!isNaN(year) && year >= 1900 && year <= 3000) {
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    }
  }
  // 如果不是有效年份，返回总计
  return {
    startDate: null,
    endDate: null,
  };
}

/**
 * Get the latest date from data
 * Returns object with year and month for i18n formatting
 */
export function getLatestDataDate(
  data?: FinancialAggregationRecord[]
): { year: number; month: number } | null {
  if (!data || data.length === 0) {
    return null;
  }

  // Sort data by date (descending)
  const sortedData = [...data].sort((a, b) => {
    // Parse date strings to ensure correct date comparison
    const dateA = parseDate(a.month_date);
    const dateB = parseDate(b.month_date);
    return dateB.getTime() - dateA.getTime();
  });

  // Get the latest month date
  const latestDate = parseDate(sortedData[0].month_date);

  const year = latestDate.getFullYear();
  const month = latestDate.getMonth() + 1;

  return { year, month };
}

/**
 * Format date range display text with i18n support
 * Returns object for i18n formatting or direct string
 */
export function formatDateRangeText(
  timeRange: TimeRange,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  // Check if it's a custom range
  if (timeRange.startsWith("custom:")) {
    const parts = timeRange.split(":");
    if (parts.length === 3) {
      const startMonth = parts[1]; // Format: YYYY-MM
      const endMonth = parts[2]; // Format: YYYY-MM

      const [startYear, startMon] = startMonth.split("-").map(Number);
      const [endYear, endMon] = endMonth.split("-").map(Number);

      return `${startYear}${t('common.year')}${startMon}${t('common.month')}${t('dateFormat.to')}${endYear}${t('common.year')}${endMon}${t('common.month')}`;
    }
  }

  switch (timeRange) {
    case "all":
      return t("dateFormat.allData");
    default: {
      // Check if it's a year
      const year = parseInt(timeRange);
      if (!isNaN(year) && year >= 1900 && year <= 3000) {
        return `${year}${t('common.year')}${t('dateFormat.fullYear')}`;
      }
      return t("dateFormat.allData");
    }
  }
}

/**
 * 从数据中提取所有可用的年份
 */
export function getAvailableYears(data?: FinancialAggregationRecord[]): number[] {
  if (!data || data.length === 0) {
    return [];
  }

  const years = new Set<number>();
  data.forEach((record) => {
    const date = parseDate(record.month_date);
    years.add(date.getFullYear());
  });

  return Array.from(years).sort((a, b) => b - a); // 降序排列
}

/**
 * 从数据中获取可用的月份范围
 */
export function getAvailableMonthRange(
  data?: FinancialAggregationRecord[]
): { minMonth: string; maxMonth: string } | null {
  if (!data || data.length === 0) {
    return null;
  }

  const dates = data
    .map((record) => parseDate(record.month_date))
    .sort((a, b) => a.getTime() - b.getTime());
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  return {
    minMonth: `${minDate.getFullYear()}-${String(
      minDate.getMonth() + 1
    ).padStart(2, "0")}`,
    maxMonth: `${maxDate.getFullYear()}-${String(
      maxDate.getMonth() + 1
    ).padStart(2, "0")}`,
  };
}

/**
 * 解析自定义时间范围（年月格式）
 */
export function parseCustomRange(
  value: string
): { startMonth: string; endMonth: string } | null {
  if (!value.startsWith("custom:")) return null;

  const parts = value.split(":");
  if (parts.length !== 3) return null;

  return {
    startMonth: parts[1],
    endMonth: parts[2],
  };
}
