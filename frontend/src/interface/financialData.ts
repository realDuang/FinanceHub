export interface FinancialRecord {
  date: string;
  housing: number;
  food: number;
  living: number;
  entertainment: number;
  transportation: number;
  travel: number;
  gifts: number;
  transactions: number;
  relationships: number;
  salary: number;
  balance: number;
  avgExpense: number;
  recentThreeMonthAvg: number;
}

// 解析CSV数据
export const financialData: FinancialRecord[] = [
  {
    date: "2022/8/1",
    housing: -25070.5,
    food: -3369.73,
    living: -4025.63,
    entertainment: -4206.45,
    transportation: -1884.98,
    travel: -40,
    gifts: -3597.88,
    transactions: -23.56,
    relationships: 101.67,
    salary: 432647.11,
    balance: 390530.05,
    avgExpense: 22768.26,
    recentThreeMonthAvg: 22768.26,
  },
  {
    date: "2022/9/1",
    housing: -200,
    food: -3745.21,
    living: -1459.11,
    entertainment: -833.46,
    transportation: -1221.78,
    travel: -180,
    gifts: -39.9,
    transactions: 51.93,
    relationships: 4255.09,
    salary: 39884.31,
    balance: 36511.87,
    avgExpense: 13123.05,
    recentThreeMonthAvg: 17945.65,
  },
];

export const expenseCategories = [
  { key: "housing", label: "住房", color: "#ef4444" },
  { key: "food", label: "餐饮", color: "#f97316" },
  { key: "living", label: "生活", color: "#eab308" },
  { key: "entertainment", label: "娱乐", color: "#22c55e" },
  { key: "transportation", label: "交通", color: "#3b82f6" },
  { key: "travel", label: "旅行", color: "#8b5cf6" },
  { key: "gifts", label: "礼物", color: "#ec4899" },
  { key: "relationships", label: "人情", color: "#06b6d4" },
];
