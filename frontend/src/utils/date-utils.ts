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
 * 获取数据中最新的日期
 */
export function getLatestDataDate(
  data?: FinancialAggregationRecord[]
): string | null {
  if (!data || data.length === 0) {
    return null;
  }

  // 对数据按日期排序（降序）
  const sortedData = [...data].sort((a, b) => {
    // 解析日期字符串，确保正确的日期比较
    const dateA = parseDate(a.month_date);
    const dateB = parseDate(b.month_date);
    return dateB.getTime() - dateA.getTime();
  });

  // 获取最新的月份日期
  const latestDate = parseDate(sortedData[0].month_date);

  // 格式化为 YYYY年MM月底
  const year = latestDate.getFullYear();
  const month = latestDate.getMonth() + 1;

  return `${year}年${month}月底`;
}

/**
 * 格式化日期范围显示文本
 */
export function formatDateRangeText(timeRange: TimeRange): string {
  // 检查是否是自定义范围
  if (timeRange.startsWith("custom:")) {
    const parts = timeRange.split(":");
    if (parts.length === 3) {
      const startMonth = parts[1]; // 格式: YYYY-MM
      const endMonth = parts[2]; // 格式: YYYY-MM

      const [startYear, startMon] = startMonth.split("-").map(Number);
      const [endYear, endMon] = endMonth.split("-").map(Number);

      return `${startYear}年${startMon}月 - ${endYear}年${endMon}月`;
    }
  }

  switch (timeRange) {
    case "all":
      return "全部数据";
    default: {
      // 检查是否是年份
      const year = parseInt(timeRange);
      if (!isNaN(year) && year >= 1900 && year <= 3000) {
        return `${year}年全年`;
      }
      return "全部数据";
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
