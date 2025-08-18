// 交易类型枚举
export enum TransactionType {
  HOUSING = "住房",
  DINING = "餐饮",
  LIVING = "生活",
  ENTERTAINMENT = "娱乐",
  TRANSPORTATION = "交通",
  TRAVEL = "旅行",
  GIFTS = "礼物",
  TRANSACTIONS = "交易",
  SOCIAL_EXPENSES = "人情",
  SALARY = "工资",
}

// 收支类型枚举
export enum IncomeExpenseType {
  INCOME = "收入",
  EXPENSE = "支出",
}

export enum PaymentMethod {
  ALIPAY = "支付宝",
  WECHAT_PAY = "微信支付",
  RELATIVE_CARD = "亲属卡",
  ICBC = "工商银行",
  CMB = "招商银行",
  BANK_OF_CHINA = "中国银行",
}

export const API_BASE_URL = `${
  import.meta.env.VITE_SERVER_HOST || "http://localhost"
}:${import.meta.env.VITE_SERVER_PORT || "8000"}/api/v1`;
