from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class FinancialRecord(Base):
    """财务记录模型"""
    __tablename__ = "financial_records"
    
    id = Column(Integer, primary_key=True, index=True)
    month_date = Column(String, nullable=False, index=True)  # 月度日期，如 "2022/8/1"
    housing = Column(Float, default=0.0)  # 住房
    dining = Column(Float, default=0.0)   # 餐饮
    living = Column(Float, default=0.0)   # 生活
    entertainment = Column(Float, default=0.0)  # 娱乐
    transportation = Column(Float, default=0.0)  # 交通
    travel = Column(Float, default=0.0)    # 旅行
    gifts = Column(Float, default=0.0)     # 礼物
    transactions = Column(Float, default=0.0)  # 交易
    social_expenses = Column(Float, default=0.0)  # 人情
    salary = Column(Float, default=0.0)    # 工资
    balance = Column(Float, default=0.0)   # 结余
    avg_consumption = Column(Float, default=0.0)  # 均匀消费支出(房租均摊)
    recent_avg_consumption = Column(Float, default=0.0)  # 近三月均匀消费支出
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Summary(Base):
    """汇总统计模型"""
    __tablename__ = "summary"
    
    id = Column(Integer, primary_key=True, index=True)
    total_months = Column(Integer, nullable=False)
    total_housing = Column(Float, default=0.0)
    total_dining = Column(Float, default=0.0)
    total_living = Column(Float, default=0.0)
    total_entertainment = Column(Float, default=0.0)
    total_transportation = Column(Float, default=0.0)
    total_travel = Column(Float, default=0.0)
    total_gifts = Column(Float, default=0.0)
    total_transactions = Column(Float, default=0.0)
    total_social_expenses = Column(Float, default=0.0)
    total_salary = Column(Float, default=0.0)
    total_balance = Column(Float, default=0.0)
    total_avg_consumption = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)