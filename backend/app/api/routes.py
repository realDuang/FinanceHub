from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os

from app.database.connection import get_db
from app.services.data_import_service import DataImportService
from app.services.financial_service import FinancialService
from app import schemas

router = APIRouter()

# 财务记录查询API
@router.get("/records", response_model=List[schemas.FinancialRecord])
def get_financial_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    获取所有财务记录（分页）
    """
    records = FinancialService.get_all_records(db, skip=skip, limit=limit)
    return records

@router.get("/records/year/{year}", response_model=List[schemas.FinancialRecord])
def get_records_by_year(
    year: int,
    db: Session = Depends(get_db)
):
    """
    根据年份获取财务记录
    """
    records = FinancialService.get_records_by_year(db, year)
    if not records:
        raise HTTPException(status_code=404, detail=f"未找到{year}年的数据")
    return records

@router.get("/records/range", response_model=List[schemas.FinancialRecord])
def get_records_by_date_range(
    start_date: str = Query(..., description="开始日期，格式：YYYY/M/D"),
    end_date: str = Query(..., description="结束日期，格式：YYYY/M/D"),
    db: Session = Depends(get_db)
):
    """
    根据日期范围获取财务记录
    """
    records = FinancialService.get_records_by_date_range(db, start_date, end_date)
    return records

@router.get("/summary", response_model=schemas.Summary)
def get_summary(db: Session = Depends(get_db)):
    """
    获取汇总统计
    """
    summary = FinancialService.get_summary(db)
    if not summary:
        raise HTTPException(status_code=404, detail="未找到汇总数据")
    return summary

# 数据分析API
@router.get("/analysis/category-trends/{category}", response_model=List[schemas.CategoryTrend])
def get_category_trends(
    category: str,
    db: Session = Depends(get_db)
):
    """
    获取指定类别的趋势数据
    
    支持的类别：housing, dining, living, entertainment, transportation, 
               travel, gifts, transactions, social_expenses, salary, balance
    """
    valid_categories = [
        "housing", "dining", "living", "entertainment", "transportation",
        "travel", "gifts", "transactions", "social_expenses", "salary", "balance"
    ]
    
    if category not in valid_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"无效的类别。支持的类别：{', '.join(valid_categories)}"
        )
    
    trends = FinancialService.get_category_trends(db, category)
    return [schemas.CategoryTrend(**trend) for trend in trends]

@router.get("/analysis/monthly-breakdown/{month_date}", response_model=schemas.MonthlyBreakdown)
def get_monthly_breakdown(
    month_date: str,
    db: Session = Depends(get_db)
):
    """
    获取指定月份的收支分解
    
    month_date格式：YYYY/M/D，例如：2024/1/1
    """
    breakdown = FinancialService.get_monthly_expenses_breakdown(db, month_date)
    if not breakdown:
        raise HTTPException(status_code=404, detail=f"未找到{month_date}的数据")
    return schemas.MonthlyBreakdown(**breakdown)

@router.get("/analysis/year-comparison", response_model=List[schemas.YearComparison])
def get_year_comparison(db: Session = Depends(get_db)):
    """
    获取年度对比分析
    """
    comparison = FinancialService.get_year_comparison(db)
    return [schemas.YearComparison(**comp) for comp in comparison]

@router.get("/analysis/top-expenses", response_model=List[schemas.TopExpenseCategory])
def get_top_expense_categories(
    limit: int = Query(5, ge=1, le=10, description="返回前N个类别"),
    db: Session = Depends(get_db)
):
    """
    获取最高支出类别排名
    """
    top_expenses = FinancialService.get_top_expense_categories(db, limit)
    return [schemas.TopExpenseCategory(**expense) for expense in top_expenses]

@router.get("/analysis/balance-trend", response_model=List[schemas.BalanceTrend])
def get_balance_trend(db: Session = Depends(get_db)):
    """
    获取结余趋势分析
    """
    trends = FinancialService.get_balance_trend(db)
    return [schemas.BalanceTrend(**trend) for trend in trends]

# 健康检查API
@router.get("/health")
def health_check():
    """
    健康检查
    """
    return {"status": "healthy", "message": "财务管理API运行正常"}