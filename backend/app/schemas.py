import enum
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from typing import Literal


class TransactionType(enum.Enum):
    """交易类型枚举"""

    HOUSING = "住房"
    DINING = "餐饮"
    LIVING = "生活"
    ENTERTAINMENT = "娱乐"
    TRANSPORTATION = "交通"
    TRAVEL = "旅行"
    GIFTS = "礼物"
    TRANSACTIONS = "交易"
    SOCIAL_EXPENSES = "人情"
    SALARY = "工资"


class IncomeExpenseType(enum.Enum):
    """收支类型枚举"""

    INCOME = "收入"
    EXPENSE = "支出"

class PaymentMethod(enum.Enum):
    """支付方式枚举"""
    
    ALIPAY = "支付宝"
    WECHAT_PAY = "微信支付"
    RELATIVE_CARD = "亲属卡"
    ICBC = "工商银行"
    CMB = "招商银行"
    BANK_OF_CHINA = "中国银行"

# 交易记录相关模型
class TransactionDetailBase(BaseModel):
    """交易明细基础模型"""

    transaction_time: datetime
    category: TransactionType
    amount: float
    income_expense_type: IncomeExpenseType
    payment_method: Optional[PaymentMethod] = None
    counterparty: Optional[str] = None
    item_name: Optional[str] = None
    remarks: Optional[str] = None


class TransactionDetail(TransactionDetailBase):
    """交易明细响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 筛选查询模型
class TransactionFilterQuery(BaseModel):
    """交易记录筛选查询模型"""

    start_date: Optional[str] = None
    end_date: Optional[str] = None
    categories: Optional[List[TransactionType]] = None
    income_expense_types: Optional[List[IncomeExpenseType]] = None
    payment_methods: Optional[List[PaymentMethod]] = None
    counterparties: Optional[List[str]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    keyword: Optional[str] = None
    skip: int = 0
    limit: int = 100
    order_by: Literal["transaction_time", "category", "amount", "income_expense_type", "payment_method", "counterparty", "item_name", "remarks"] = "transaction_time"
    order_direction: Literal["asc", "desc"] = "desc"


# 分页信息模型
class PaginationInfo(BaseModel):
    """分页信息模型"""

    skip: int
    limit: int
    has_more: bool


# 筛选结果模型
class TransactionFilterResult(BaseModel):
    """交易筛选结果模型"""

    records: List[TransactionDetail]
    total: int
    filters_applied: List[str]
    pagination: PaginationInfo


# 财务聚合记录相关模型
class FinancialAggregationBase(BaseModel):
    """财务聚合记录基础模型"""

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


class FinancialAggregation(FinancialAggregationBase):
    """财务聚合记录响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 财务记录查询模型
class FinancialQuery(BaseModel):
    """财务记录查询模型"""

    skip: int = 0
    limit: int = 100
    order_by: str = "month_date"
    order_direction: Literal["asc", "desc"] = "desc"
