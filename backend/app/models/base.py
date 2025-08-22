from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime


Base = declarative_base()


class TransactionDetail(Base):
    """交易明细模型"""

    __tablename__ = "transaction_details"

    id = Column(Integer, primary_key=True, index=True)
    transaction_time = Column(DateTime, nullable=False, index=True)  # 交易时间
    category = Column(String(15), nullable=False, index=True)  # 类型 (住房、餐饮等)
    amount = Column(Float, nullable=False)  # 金额
    income_expense_type = Column(String(7), nullable=False, index=True)  # 收/支
    payment_method = Column(String(13), nullable=True)  # 支付方式
    counterparty = Column(String(200), nullable=True)  # 交易对方
    item_name = Column(String(500), nullable=True)  # 商品名称
    remarks = Column(Text, nullable=True)  # 备注
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class FinancialAggregation(Base):
    """财务记录模型"""

    __tablename__ = "financial_aggregation"

    id = Column(Integer, primary_key=True, index=True)
    month_date = Column(String, nullable=False, index=True)  # 月度日期，如 "2022/8/1"
    housing = Column(Float, default=0.0)  # 住房
    dining = Column(Float, default=0.0)  # 餐饮
    living = Column(Float, default=0.0)  # 生活
    entertainment = Column(Float, default=0.0)  # 娱乐
    transportation = Column(Float, default=0.0)  # 交通
    travel = Column(Float, default=0.0)  # 旅行
    gifts = Column(Float, default=0.0)  # 礼物
    transactions = Column(Float, default=0.0)  # 交易
    social_expenses = Column(Float, default=0.0)  # 人情
    salary = Column(Float, default=0.0)  # 工资
    balance = Column(Float, default=0.0)  # 结余
    avg_consumption = Column(Float, default=0.0)  # 均匀消费支出(房租均摊)
    recent_avg_consumption = Column(Float, default=0.0)  # 近三月均匀消费支出
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Asset(Base):
    """资产模型"""

    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # 资产名称
    value = Column(Float, nullable=False)  # 资产价值
    category = Column(
        String(20), nullable=False, index=True
    )  # 资产类别: current/non-current
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Liability(Base):
    """负债模型"""

    __tablename__ = "liabilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # 负债名称
    value = Column(Float, nullable=False)  # 负债金额
    category = Column(
        String(20), nullable=False, index=True
    )  # 负债类别: current/non-current
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
