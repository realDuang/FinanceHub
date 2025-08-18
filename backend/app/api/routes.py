from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os

from app.database.connection import get_db
from app.services.analyze.financial_service import FinancialService
from app.services.analyze.transaction_service import TransactionService
from app import schemas

router = APIRouter()


# 交易记录查询API
@router.post("/transactions/search", response_model=schemas.TransactionFilterResult)
def search_transactions(
    filter_query: schemas.TransactionFilterQuery, db: Session = Depends(get_db)
):
    """
    根据多种条件筛选交易记录
    """
    try:
        result = TransactionService.get_records(
            db=db,
            start_date=filter_query.start_date,
            end_date=filter_query.end_date,
            categories=filter_query.categories,
            income_expense_types=filter_query.income_expense_types,
            payment_methods=filter_query.payment_methods,
            counterparties=filter_query.counterparties,
            min_amount=filter_query.min_amount,
            max_amount=filter_query.max_amount,
            keyword=filter_query.keyword,
            skip=filter_query.skip,
            limit=filter_query.limit,
            order_by=filter_query.order_by,
            order_direction=filter_query.order_direction,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"筛选交易记录失败: {str(e)}")


# 财务记录查询API
@router.get("/financial/records", response_model=List[schemas.FinancialAggregation])
def get_financial_records(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    order_by: str = Query(default="month_date"),
    order_direction: str = Query(default="asc"),
    db: Session = Depends(get_db)
):
    """
    获取财务聚合记录
    """
    try:
        result = FinancialService.get_records(
            db=db,
            skip=skip,
            limit=limit,
            order_by=order_by,
            order_direction=order_direction,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取财务记录失败: {str(e)}")


# 健康检查API
@router.get("/health")
def health_check():
    """
    健康检查
    """
    return {"status": "healthy", "message": "财务管理API运行正常"}
