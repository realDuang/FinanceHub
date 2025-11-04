export const expenseCategories = [
  { key: "housing", color: "#ef4444" },
  { key: "dining", color: "#f97316" },
  { key: "living", color: "#eab308" },
  { key: "entertainment", color: "#22c55e" },
  { key: "transportation", color: "#3b82f6" },
  { key: "travel", color: "#8b5cf6" },
  { key: "gifts", color: "#ec4899" },
  { key: "transactions", color: "#f59e0b" },
];

/**
 * Get translated expense category label
 * @param key Category key
 * @param t Translation function from useTranslation hook
 * @returns Translated category label
 */
export function getCategoryLabel(key: string, t: (key: string) => string): string {
  return t(`categories.${key}`);
}

/**
 * Format currency amount with locale support
 * @param amount Amount to format
 * @param currency Currency symbol (optional, will use locale default if not provided)
 * @param locale Locale string for number formatting (optional, will use 'zh-CN' if not provided)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency?: string, locale: string = 'zh-CN'): string {
  // Fix floating point precision issues, keep 2 decimal places
  const fixedAmount = Math.round(amount * 100) / 100;
  
  const formattedNumber = fixedAmount.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  // Use provided currency or default based on locale
  const currencySymbol = currency || (locale === 'zh-CN' ? '￥' : '$');
  
  return `${currencySymbol}${formattedNumber}`;
}

/**
 * Format date with locale support
 * @param dateString Date string to format
 * @param format Format pattern, supports YYYY-MM or localized format
 * @param useLocalizedFormat Whether to use localized format (e.g., "年月" for Chinese)
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format: string = "YYYY-MM", useLocalizedFormat: boolean = false): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (useLocalizedFormat) {
    // Return format for i18n usage: caller should append year/month labels via i18n
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  
  switch (format) {
    case "YYYY-MM":
      return `${year}-${String(month).padStart(2, '0')}`;
    default:
      return `${year}-${String(month).padStart(2, '0')}`;
  }
}

/**
 * Format integer
 * @param num Number to format
 * @returns Formatted integer string
 */
export function formatInteger(num: number): string {
  return Math.round(num).toString();
}
