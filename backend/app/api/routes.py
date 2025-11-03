from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os
import io
import json

from app.database.connection import get_db
from app.services.analyze.financial_service import FinancialService
from app.services.analyze.transaction_service import TransactionService
from app.services.balance_sheet_service import BalanceSheetService
from app.services.transaction_import_export_service import TransactionImportExportService
from app.services.bill_parser_service import BillParser, BillParserError
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


# =================================
# 交易明细导入导出 API
# =================================

@router.get("/transactions/export")
def export_transactions_csv(
    start_date: Optional[str] = Query(default=None, description="开始日期，格式：YYYY-MM-DD"),
    end_date: Optional[str] = Query(default=None, description="结束日期，格式：YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    导出交易明细为CSV文件
    """
    try:
        csv_content = TransactionImportExportService.export_to_csv(
            db=db,
            start_date=start_date,
            end_date=end_date
        )
        
        # 生成文件名
        filename = "transactions"
        if start_date and end_date:
            filename += f"_{start_date}_to_{end_date}"
        elif start_date:
            filename += f"_from_{start_date}"
        elif end_date:
            filename += f"_to_{end_date}"
        filename += ".csv"
        
        # 返回CSV文件
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出交易明细失败: {str(e)}")


@router.post("/transactions/import")
def import_transactions_csv(
    file: UploadFile = File(...),
    enable_deduplication: bool = Query(default=True, description="是否启用去重"),
    db: Session = Depends(get_db)
):
    """
    从CSV文件导入交易明细
    """
    try:
        # 验证文件类型
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="只支持CSV文件格式")
        
        # 读取文件内容
        csv_content = file.file.read().decode('utf-8')
        
        # 导入数据
        result = TransactionImportExportService.import_from_csv(
            db=db,
            csv_content=csv_content,
            enable_deduplication=enable_deduplication
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入交易明细失败: {str(e)}")


@router.post("/transactions/import/records")
def import_transactions_records(
    payload: schemas.TransactionImportPayload,
    db: Session = Depends(get_db),
):
    """提交编辑后的交易记录列表进行导入"""

    records = [
        record.model_dump() if hasattr(record, "model_dump") else record.dict()
        for record in payload.records
    ]

    try:
        result = TransactionImportExportService.import_from_json_records(
            db=db,
            records=records,
            enable_deduplication=payload.enable_deduplication
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入交易明细失败: {str(e)}")


@router.post("/transactions/import/alipay-bill")
def import_alipay_bill(
    file: UploadFile = File(...),
    enable_deduplication: bool = Query(default=True, description="是否启用去重"),
    db: Session = Depends(get_db)
):
    """导入支付宝账单"""
    return _import_payment_bill(
        file=file,
        db=db,
        enable_deduplication=enable_deduplication,
        expected_formats={"alipay"},
        interface_name="支付宝"
    )


@router.post("/transactions/import/wechat-bill")
def import_wechat_bill(
    file: UploadFile = File(...),
    enable_deduplication: bool = Query(default=True, description="是否启用去重"),
    db: Session = Depends(get_db)
):
    """导入微信支付账单"""
    return _import_payment_bill(
        file=file,
        db=db,
        enable_deduplication=enable_deduplication,
        expected_formats={"wechat", "wechat_xlsx"},
        interface_name="微信支付"
    )


def _import_payment_bill(
    *,
    file: UploadFile,
    db: Session,
    enable_deduplication: bool,
    expected_formats: set[str],
    interface_name: str
):
    try:
        _ = enable_deduplication  # 保留参数以兼容现有前端调用
        file_bytes = file.file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="上传文件为空")

        parse_result = BillParser.parse(file_bytes, file.filename)
        detected_format = parse_result.details.get("format")

        if detected_format not in expected_formats:
            expected_desc = "或".join(sorted(expected_formats))
            raise HTTPException(
                status_code=400,
                detail=f"文件格式与{interface_name}接口不匹配，检测到: {detected_format or '未知'} (期望: {expected_desc})"
            )

        csv_buffer = io.StringIO()
        parse_result.dataframe.to_csv(csv_buffer, index=False, encoding="utf-8-sig")
        csv_bytes = csv_buffer.getvalue().encode("utf-8-sig")
        csv_stream = io.BytesIO(csv_bytes)

        original_name = (file.filename or f"{interface_name}_bill").strip() or "bill"
        base_name, _ = os.path.splitext(original_name)
        safe_base = base_name or "bill"
        normalized_filename = f"{safe_base}_normalized.csv"

        from urllib.parse import quote

        ascii_fallback = "bill_normalized.csv"
        encoded_filename = quote(normalized_filename)
        content_disposition = (
            f"attachment; filename={ascii_fallback}; filename*=UTF-8''{encoded_filename}"
        )

        headers = {
            "Content-Disposition": content_disposition,
            "X-Parser-Details": json.dumps(parse_result.details, ensure_ascii=True)
        }

        csv_stream.seek(0)
        return StreamingResponse(csv_stream, media_type="text/csv; charset=utf-8", headers=headers)

    except BillParserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入{interface_name}账单失败: {str(e)}")


@router.get("/transactions/template")
def get_csv_template():
    """
    获取CSV导入模板
    """
    try:
        csv_content = TransactionImportExportService.get_csv_template()
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transaction_template.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取CSV模板失败: {str(e)}")
