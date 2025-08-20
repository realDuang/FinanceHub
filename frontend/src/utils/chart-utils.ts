export const expenseCategories = [
  { key: "housing", label: "住房", color: "#ef4444" },
  { key: "dining", label: "餐饮", color: "#f97316" },
  { key: "living", label: "生活", color: "#eab308" },
  { key: "entertainment", label: "娱乐", color: "#22c55e" },
  { key: "transportation", label: "交通", color: "#3b82f6" },
  { key: "travel", label: "旅行", color: "#8b5cf6" },
  { key: "gifts", label: "礼物", color: "#ec4899" },
  { key: "transactions", label: "交易", color: "#f59e0b" },
];

/**
 * 格式化货币金额
 * @param amount 金额
 * @param currency 货币符号，默认为￥
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number, currency: string = "￥"): string {
  // 修复浮点数精度问题，保留2位小数
  const fixedAmount = Math.round(amount * 100) / 100;
  
  return `${currency}${fixedAmount.toLocaleString('zh-CN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @param format 格式化模式，支持 YYYY-MM、YYYY年MM月 等
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string, format: string = "YYYY-MM"): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  switch (format) {
    case "YYYY-MM":
      return `${year}-${String(month).padStart(2, '0')}`;
    case "YYYY年MM月":
      return `${year}年${month}月`;
    default:
      return `${year}-${String(month).padStart(2, '0')}`;
  }
}

/**
 * 格式化整数
 * @param num 数字
 * @returns 格式化后的整数字符串
 */
export function formatInteger(num: number): string {
  return Math.round(num).toString();
}
