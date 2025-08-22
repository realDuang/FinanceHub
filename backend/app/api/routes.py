from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os

from app.database.connection import get_db
from app.services.analyze.financial_service import FinancialService
from app.services.analyze.transaction_service import TransactionService
from app.services.balance_sheet_service import BalanceSheetService
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
    limit: int = Query(default=100, ge=1, le=10000),
    order_by: str = Query(default="month_date"),
    order_direction: str = Query(default="asc"),
    start_date: Optional[str] = Query(default=None, description="开始日期，格式：YYYY-MM-DD"),
    end_date: Optional[str] = Query(default=None, description="结束日期，格式：YYYY-MM-DD"),
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
            start_date=start_date,
            end_date=end_date,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取财务记录失败: {str(e)}")


# =================================
# 资产负债表 API
# =================================

# 获取所有资产
@router.get("/balance-sheet/assets", response_model=List[schemas.Asset])
def get_assets(db: Session = Depends(get_db)):
    """获取所有资产"""
    try:
        service = BalanceSheetService(db)
        return service.get_assets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取资产失败: {str(e)}")


# 创建资产
@router.post("/balance-sheet/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    """创建新资产"""
    try:
        service = BalanceSheetService(db)
        return service.create_asset(asset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建资产失败: {str(e)}")


# 更新资产
@router.put("/balance-sheet/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(
    asset_id: int, 
    asset_update: schemas.AssetUpdate, 
    db: Session = Depends(get_db)
):
    """更新资产"""
    try:
        service = BalanceSheetService(db)
        updated_asset = service.update_asset(asset_id, asset_update)
        if not updated_asset:
            raise HTTPException(status_code=404, detail="资产不存在")
        return updated_asset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新资产失败: {str(e)}")


# 删除资产
@router.delete("/balance-sheet/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    """删除资产"""
    try:
        service = BalanceSheetService(db)
        success = service.delete_asset(asset_id)
        if not success:
            raise HTTPException(status_code=404, detail="资产不存在")
        return {"message": "资产删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除资产失败: {str(e)}")


# 获取所有负债
@router.get("/balance-sheet/liabilities", response_model=List[schemas.Liability])
def get_liabilities(db: Session = Depends(get_db)):
    """获取所有负债"""
    try:
        service = BalanceSheetService(db)
        return service.get_liabilities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取负债失败: {str(e)}")


# 创建负债
@router.post("/balance-sheet/liabilities", response_model=schemas.Liability)
def create_liability(liability: schemas.LiabilityCreate, db: Session = Depends(get_db)):
    """创建新负债"""
    try:
        service = BalanceSheetService(db)
        return service.create_liability(liability)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建负债失败: {str(e)}")


# 更新负债
@router.put("/balance-sheet/liabilities/{liability_id}", response_model=schemas.Liability)
def update_liability(
    liability_id: int, 
    liability_update: schemas.LiabilityUpdate, 
    db: Session = Depends(get_db)
):
    """更新负债"""
    try:
        service = BalanceSheetService(db)
        updated_liability = service.update_liability(liability_id, liability_update)
        if not updated_liability:
            raise HTTPException(status_code=404, detail="负债不存在")
        return updated_liability
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新负债失败: {str(e)}")


# 删除负债
@router.delete("/balance-sheet/liabilities/{liability_id}")
def delete_liability(liability_id: int, db: Session = Depends(get_db)):
    """删除负债"""
    try:
        service = BalanceSheetService(db)
        success = service.delete_liability(liability_id)
        if not success:
            raise HTTPException(status_code=404, detail="负债不存在")
        return {"message": "负债删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除负债失败: {str(e)}")


# 获取完整的资产负债表数据
@router.get("/balance-sheet/data", response_model=schemas.BalanceSheetData)
def get_balance_sheet_data(db: Session = Depends(get_db)):
    """获取完整的资产负债表数据"""
    try:
        service = BalanceSheetService(db)
        return service.get_balance_sheet_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取资产负债表数据失败: {str(e)}")


# 健康检查API
@router.get("/health")
def health_check():
    """
    健康检查
    """
    return {"status": "healthy", "message": "财务管理API运行正常"}
