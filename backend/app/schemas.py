from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FinancialRecordBase(BaseModel):
    """财务记录基础模型"""
    month_date: str
    housing: float = 0.0
    dining: float = 0.0
    living: float = 0.0
    entertainment: float = 0.0
    transportation: float = 0.0
    travel: float = 0.0
    gifts: float = 0.0
    transactions: float = 0.0
    social_expenses: float = 0.0
    salary: float = 0.0
    balance: float = 0.0
    avg_consumption: float = 0.0
    recent_avg_consumption: float = 0.0

class FinancialRecordCreate(FinancialRecordBase):
    """创建财务记录模型"""
    pass

class FinancialRecord(FinancialRecordBase):
    """财务记录响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SummaryBase(BaseModel):
    """汇总基础模型"""
    total_months: int
    total_housing: float = 0.0
    total_dining: float = 0.0
    total_living: float = 0.0
    total_entertainment: float = 0.0
    total_transportation: float = 0.0
    total_travel: float = 0.0
    total_gifts: float = 0.0
    total_transactions: float = 0.0
    total_social_expenses: float = 0.0
    total_salary: float = 0.0
    total_balance: float = 0.0
    total_avg_consumption: float = 0.0

class Summary(SummaryBase):
    """汇总响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ImportResult(BaseModel):
    """导入结果模型"""
    success: bool
    message: str
    imported_records: int
    total_months: int

class CategoryTrend(BaseModel):
    """类别趋势模型"""
    date: str
    value: float

class MonthlyBreakdown(BaseModel):
    """月度分解模型"""
    month_date: str
    expenses: Dict[str, float]
    income: Dict[str, float]
    balance: float

class YearComparison(BaseModel):
    """年度对比模型"""
    year: str
    total_expenses: float
    total_income: float
    net_balance: float
    months_count: int

class TopExpenseCategory(BaseModel):
    """顶级支出类别模型"""
    category: str
    total_amount: float

class BalanceTrend(BaseModel):
    """结余趋势模型"""
    date: str
    balance: float

class DateRangeQuery(BaseModel):
    """日期范围查询模型"""
    start_date: str
    end_date: str

class PaginationQuery(BaseModel):
    """分页查询模型"""
    skip: int = 0
    limit: int = 100
