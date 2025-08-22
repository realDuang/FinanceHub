import { TimeRange } from '../components/CashFlowAnalysis/TimeRangeSelector';
import type { FinancialAggregationRecord } from '../services/types';

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

/**
 * 从月度数据中获取最新的三个月日期范围
 */
export function getLatest3MonthsFromData(data: FinancialAggregationRecord[]): DateRange {
  if (!data || data.length === 0) {
    return { startDate: null, endDate: null };
  }

  // 对数据按日期排序（降序）
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.month_date);
    const dateB = new Date(b.month_date);
    return dateB.getTime() - dateA.getTime();
  });

  // 取最新的3个月
  const latest3Months = sortedData.slice(0, 3);
  
  if (latest3Months.length === 0) {
    return { startDate: null, endDate: null };
  }

  // 最新日期作为结束日期
  const latestDate = new Date(latest3Months[0].month_date);
  const endDate = `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, '0')}-${String(latestDate.getDate()).padStart(2, '0')}`;

  // 最早日期作为开始日期
  const earliestDate = new Date(latest3Months[latest3Months.length - 1].month_date);
  const startDate = `${earliestDate.getFullYear()}-${String(earliestDate.getMonth() + 1).padStart(2, '0')}-${String(earliestDate.getDate()).padStart(2, '0')}`;

  return { startDate, endDate };
}

/**
 * 根据时间范围类型计算开始和结束日期
 */
export function getDateRangeFromTimeRange(
  timeRange: TimeRange, 
  allData?: FinancialAggregationRecord[]
): DateRange {
  const now = new Date();
  
  switch (timeRange) {
    case 'last3months': {
      // 如果有数据，从数据中获取最新三个月
      if (allData && allData.length > 0) {
        return getLatest3MonthsFromData(allData);
      }
      // 否则使用当前日期计算（作为fallback）
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return {
        startDate: threeMonthsAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    case 'all': {
      // 总计 - 不设置日期范围
      return {
        startDate: null,
        endDate: null,
      };
    }
    default: {
      // 检查是否是年份（数字字符串）
      const year = parseInt(timeRange);
      if (!isNaN(year) && year >= 1900 && year <= 3000) {
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
        };
      }
      // 如果不是有效年份，返回总计
      return {
        startDate: null,
        endDate: null,
      };
    }
  }
}

/**
 * 获取数据中最新的日期
 */
export function getLatestDataDate(data?: FinancialAggregationRecord[]): string | null {
  if (!data || data.length === 0) {
    return null;
  }

  // 对数据按日期排序（降序）
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.month_date);
    const dateB = new Date(b.month_date);
    return dateB.getTime() - dateA.getTime();
  });

  // 获取最新的月份日期
  const latestDate = new Date(sortedData[0].month_date);
  
  // 格式化为 YYYY年MM月底
  const year = latestDate.getFullYear();
  const month = latestDate.getMonth() + 1;
  
  return `${year}年${month}月底`;
}

/**
 * 格式化日期范围显示文本
 */
export function formatDateRangeText(
  timeRange: TimeRange, 
  allData?: FinancialAggregationRecord[]
): string {
  switch (timeRange) {
    case 'last3months': {
      if (allData && allData.length > 0) {
        const latest3Months = getLatest3MonthsFromData(allData);
        if (latest3Months.startDate && latest3Months.endDate) {
          const start = new Date(latest3Months.startDate);
          const end = new Date(latest3Months.endDate);
          return `${start.getFullYear()}年${start.getMonth() + 1}月 - ${end.getFullYear()}年${end.getMonth() + 1}月`;
        }
      }
      return '最近三个月';
    }
    case 'all':
      return '全部数据';
    default: {
      // 检查是否是年份
      const year = parseInt(timeRange);
      if (!isNaN(year) && year >= 1900 && year <= 3000) {
        return `${year}年全年`;
      }
      return '全部数据';
    }
  }
}
