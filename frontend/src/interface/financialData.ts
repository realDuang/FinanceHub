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
    recentThreeMonthAvg: 22768.26
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
    recentThreeMonthAvg: 17945.65
  },
  {
    date: "2022/10/1",
    housing: -12000,
    food: -3337.87,
    living: -2096.57,
    entertainment: -2876.6,
    transportation: -31.03,
    travel: -50,
    gifts: -8382.2,
    transactions: 7.8,
    relationships: -510.1,
    salary: 39312.64,
    balance: 10036.07,
    avgExpense: 22417.86,
    recentThreeMonthAvg: 19436.39
  },
  {
    date: "2022/11/1",
    housing: -200,
    food: -2641.68,
    living: -2016.68,
    entertainment: -355.06,
    transportation: -239.52,
    travel: 0,
    gifts: -274.72,
    transactions: 0,
    relationships: 1512.61,
    salary: 37259.25,
    balance: 33044.2,
    avgExpense: 11171.25,
    recentThreeMonthAvg: 15570.72
  },
  {
    date: "2022/12/1",
    housing: 0,
    food: -1763.68,
    living: -619.66,
    entertainment: -377.98,
    transportation: -3485.41,
    travel: -808.8,
    gifts: -2156,
    transactions: 30,
    relationships: 0,
    salary: 36471.51,
    balance: 27289.98,
    avgExpense: 14855.12,
    recentThreeMonthAvg: 16148.08
  },
  {
    date: "2023/1/1",
    housing: -12100,
    food: -1637.25,
    living: -1221.12,
    entertainment: -232.6,
    transportation: -2432.88,
    travel: -4148.41,
    gifts: -1127,
    transactions: 1.78,
    relationships: 21430.59,
    salary: 43112.64,
    balance: 41645.75,
    avgExpense: 16442.85,
    recentThreeMonthAvg: 14156.41
  },
  {
    date: "2023/2/1",
    housing: -100,
    food: -1842.91,
    living: -378.63,
    entertainment: -10888.1,
    transportation: -578.93,
    travel: -847.84,
    gifts: -29.1,
    transactions: 0,
    relationships: -999,
    salary: 60798.92,
    balance: 45134.41,
    avgExpense: 20209.1,
    recentThreeMonthAvg: 17169.02
  },
  {
    date: "2023/3/1",
    housing: -100,
    food: -1194.43,
    living: -2497.4,
    entertainment: -431.92,
    transportation: -6093.88,
    travel: -4282.29,
    gifts: -501.21,
    transactions: 230.73,
    relationships: 210100.52,
    salary: 39136.54,
    balance: 234366.66,
    avgExpense: 20644.72,
    recentThreeMonthAvg: 19098.89
  },
  {
    date: "2023/4/1",
    housing: -12100,
    food: -1659.32,
    living: -3538.68,
    entertainment: -703.42,
    transportation: -5865.23,
    travel: 0,
    gifts: -297.53,
    transactions: 0.03,
    relationships: 5823,
    salary: 52809.46,
    balance: 34468.31,
    avgExpense: 17707.77,
    recentThreeMonthAvg: 19520.53
  },
  {
    date: "2023/5/1",
    housing: -50,
    food: -2041.83,
    living: -149.71,
    entertainment: -1485.26,
    transportation: 1219.07,
    travel: 0,
    gifts: 0,
    transactions: 2160.42,
    relationships: 117873.94,
    salary: 32793.85,
    balance: 150320.48,
    avgExpense: 8101.32,
    recentThreeMonthAvg: 15484.6
  },
  {
    date: "2024/10/1",
    housing: -150,
    food: -1318.48,
    living: -866.43,
    entertainment: -8420.42,
    transportation: -597.99,
    travel: -1065.08,
    gifts: -698.31,
    transactions: 522.25,
    relationships: 19.84,
    salary: 77492.02,
    balance: 64917.4,
    avgExpense: 18610.3,
    recentThreeMonthAvg: 14659.64
  },
  {
    date: "2024/11/1",
    housing: -330.01,
    food: -2772.65,
    living: -3760.11,
    entertainment: -4930.51,
    transportation: -577.17,
    travel: -464.15,
    gifts: -635,
    transactions: 65.84,
    relationships: 51719,
    salary: 43138.14,
    balance: 81453.38,
    avgExpense: 18783.18,
    recentThreeMonthAvg: 17490.75
  },
  {
    date: "2024/12/1",
    housing: -15050,
    food: -1621.04,
    living: -1837.33,
    entertainment: -529.71,
    transportation: -814.2,
    travel: -1396.55,
    gifts: -40.2,
    transactions: 43.84,
    relationships: 19.82,
    salary: 42413.96,
    balance: 21188.59,
    avgExpense: 11882.62,
    recentThreeMonthAvg: 16425.37
  }
];

export const expenseCategories = [
  { key: 'housing', label: '住房', color: '#ef4444' },
  { key: 'food', label: '餐饮', color: '#f97316' },
  { key: 'living', label: '生活', color: '#eab308' },
  { key: 'entertainment', label: '娱乐', color: '#22c55e' },
  { key: 'transportation', label: '交通', color: '#3b82f6' },
  { key: 'travel', label: '旅行', color: '#8b5cf6' },
  { key: 'gifts', label: '礼物', color: '#ec4899' },
  { key: 'relationships', label: '人情', color: '#06b6d4' }
];