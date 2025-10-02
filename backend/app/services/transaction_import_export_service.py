"""
交易明细导入导出服务
支持CSV格式的交易明细数据导入导出
"""

import pandas as pd
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from io import StringIO

from app.models.base import TransactionDetail, FinancialAggregation
from app.services.aggregation_service import AggregationService


class TransactionImportExportService:
    """交易明细导入导出服务"""

    # CSV文件的标准列名
    CSV_COLUMNS = [
        "交易时间",
        "类型", 
        "金额",
        "收支",
        "支付方式",
        "交易对方",
        "商品名称",
        "备注"
    ]

    @staticmethod
    def _clean_string_value(value) -> str:
        """
        清理字符串值，处理NaN、None等情况
        
        Args:
            value: 原始值
            
        Returns:
            清理后的字符串
        """
        if pd.isna(value) or value is None:
            return ""
        
        str_value = str(value).strip()
        return "" if str_value.lower() == "nan" else str_value

    @staticmethod
    def _is_empty_value(value) -> bool:
        """
        判断值是否为空
        
        Args:
            value: 要检查的值
            
        Returns:
            是否为空
        """
        if pd.isna(value) or value is None:
            return True
        
        str_value = str(value).strip()
        return str_value == "" or str_value.lower() == "nan"

    @staticmethod
    def export_to_csv(
        db: Session,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        导出交易明细为CSV文件
        
        Args:
            db: 数据库会话
            start_date: 开始日期 (格式: YYYY-MM-DD)
            end_date: 结束日期 (格式: YYYY-MM-DD)
            output_path: 输出文件路径，如果为None则返回CSV内容字符串
            
        Returns:
            CSV文件路径或CSV内容字符串
        """
        try:
            # 构建查询
            query = db.query(TransactionDetail)
            
            # 添加日期过滤
            if start_date:
                query = query.filter(TransactionDetail.transaction_time >= start_date)
            if end_date:
                # 结束日期包含当天，所以要加一天
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
                query = query.filter(TransactionDetail.transaction_time < end_datetime.replace(hour=23, minute=59, second=59))
            
            # 按时间倒序排列
            transactions = query.order_by(TransactionDetail.transaction_time.desc()).all()
            
            # 转换为DataFrame
            data = []
            for transaction in transactions:
                data.append({
                    "交易时间": transaction.transaction_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "类型": transaction.category,
                    "金额": transaction.amount,
                    "收支": transaction.income_expense_type,
                    "支付方式": transaction.payment_method or "",
                    "交易对方": transaction.counterparty or "",
                    "商品名称": transaction.item_name or "",
                    "备注": transaction.remarks or ""
                })
            
            df = pd.DataFrame(data, columns=TransactionImportExportService.CSV_COLUMNS)
            
            if output_path:
                # 保存到文件
                df.to_csv(output_path, index=False, encoding='utf-8-sig')
                return output_path
            else:
                # 返回CSV字符串
                output = StringIO()
                df.to_csv(output, index=False, encoding='utf-8')
                return output.getvalue()
                
        except Exception as e:
            raise Exception(f"导出CSV失败: {str(e)}")

    @staticmethod
    def import_from_csv(
        db: Session,
        csv_content: str = None,
        csv_file_path: str = None,
        enable_deduplication: bool = True
    ) -> Dict[str, Any]:
        """
        从CSV导入交易明细数据
        
        Args:
            db: 数据库会话
            csv_content: CSV内容字符串
            csv_file_path: CSV文件路径
            enable_deduplication: 是否启用去重
            
        Returns:
            导入结果统计
        """
        try:
            if csv_content is not None:
                df = pd.read_csv(StringIO(csv_content), encoding='utf-8')
            elif csv_file_path:
                df = pd.read_csv(csv_file_path, encoding='utf-8')
            else:
                raise ValueError("必须提供csv_content或csv_file_path")
        except Exception as e:
            return {
                "success": False,
                "message": f"读取CSV失败: {str(e)}",
                "imported_count": 0,
                "skipped_count": 0,
                "duplicate_count": 0,
                "error_details": [],
                "duplicate_details": []
            }

        return TransactionImportExportService._import_dataframe(
            db=db,
            df=df,
            enable_deduplication=enable_deduplication
        )

    @staticmethod
    def import_from_dataframe(
        db: Session,
        df: pd.DataFrame,
        enable_deduplication: bool = True
    ) -> Dict[str, Any]:
        """从已经准备好的DataFrame导入交易明细数据。"""
        return TransactionImportExportService._import_dataframe(
            db=db,
            df=df,
            enable_deduplication=enable_deduplication
        )

    @staticmethod
    def _import_dataframe(
        db: Session,
        df: pd.DataFrame,
        enable_deduplication: bool = True
    ) -> Dict[str, Any]:
        try:
            working_df = df.copy()

            validation_result = TransactionImportExportService._validate_csv_format(working_df)
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "message": validation_result["message"],
                    "imported_count": 0,
                    "skipped_count": 0,
                    "duplicate_count": 0,
                    "error_details": [],
                    "duplicate_details": []
                }

            imported_count = 0
            skipped_count = 0
            duplicate_count = 0
            error_details: List[Dict[str, Any]] = []
            duplicate_details: List[Dict[str, Any]] = []

            for index, row in working_df.iterrows():
                try:
                    required_fields = ["交易时间", "类型", "金额", "收支"]
                    for field in required_fields:
                        if TransactionImportExportService._is_empty_value(row[field]):
                            raise ValueError(f"必需字段 '{field}' 为空")

                    try:
                        transaction_time = pd.to_datetime(row["交易时间"])
                    except Exception as e:
                        raise ValueError(f"交易时间格式错误: {str(e)}")

                    try:
                        amount = float(row["金额"])
                        if amount < 0:
                            raise ValueError("金额不能为负数")
                    except ValueError as e:
                        if "could not convert" in str(e) or "invalid literal" in str(e):
                            raise ValueError("金额格式错误，必须为数字")
                        raise e

                    category = TransactionImportExportService._clean_string_value(row["类型"])
                    income_expense_type = TransactionImportExportService._clean_string_value(row["收支"])

                    if not category:
                        raise ValueError("交易类型不能为空")
                    if not income_expense_type:
                        raise ValueError("收支类型不能为空")

                    if enable_deduplication:
                        counterparty_for_check = TransactionImportExportService._clean_string_value(row["交易对方"])
                        item_name_for_check = TransactionImportExportService._clean_string_value(row["商品名称"])

                        is_duplicate = TransactionImportExportService._check_duplicate(
                            db, transaction_time, amount, counterparty_for_check, item_name_for_check
                        )
                        if is_duplicate:
                            duplicate_count += 1
                            duplicate_details.append({
                                "row": index + 2,
                                "transaction_time": str(transaction_time),
                                "amount": amount,
                                "counterparty": TransactionImportExportService._clean_string_value(row["交易对方"]),
                                "item_name": TransactionImportExportService._clean_string_value(row["商品名称"]),
                                "reason": "数据重复：相同时间、金额、交易对方和商品名称的记录已存在"
                            })
                            continue

                    payment_method = TransactionImportExportService._clean_string_value(row["支付方式"])
                    counterparty = TransactionImportExportService._clean_string_value(row["交易对方"])
                    item_name = TransactionImportExportService._clean_string_value(row["商品名称"])
                    remarks = TransactionImportExportService._clean_string_value(row["备注"])

                    transaction = TransactionDetail(
                        transaction_time=transaction_time,
                        category=category,
                        amount=amount,
                        income_expense_type=income_expense_type,
                        payment_method=payment_method if payment_method else None,
                        counterparty=counterparty if counterparty else None,
                        item_name=item_name if item_name else None,
                        remarks=remarks if remarks else None
                    )

                    db.add(transaction)
                    imported_count += 1

                except Exception as e:
                    error_message = str(e)
                    print(f"处理第{index+2}行数据失败: {error_message}")
                    skipped_count += 1
                    error_details.append({
                        "row": index + 2,
                        "data": {
                            "交易时间": str(row.get("交易时间", "")),
                            "类型": str(row.get("类型", "")),
                            "金额": str(row.get("金额", "")),
                            "收支": str(row.get("收支", "")),
                            "支付方式": str(row.get("支付方式", "")),
                            "交易对方": str(row.get("交易对方", "")),
                            "商品名称": str(row.get("商品名称", "")),
                            "备注": str(row.get("备注", ""))
                        },
                        "reason": error_message
                    })
                    continue

            db.commit()
            TransactionImportExportService._refresh_financial_aggregation(db)

            return {
                "success": True,
                "message": "数据导入成功",
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "duplicate_count": duplicate_count,
                "error_details": error_details,
                "duplicate_details": duplicate_details
            }

        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"数据导入失败: {str(e)}",
                "imported_count": 0,
                "skipped_count": 0,
                "duplicate_count": 0,
                "error_details": [],
                "duplicate_details": []
            }

    @staticmethod
    def _validate_csv_format(df: pd.DataFrame) -> Dict[str, Any]:
        """
        验证CSV文件格式
        
        Args:
            df: pandas DataFrame
            
        Returns:
            验证结果
        """
        required_columns = TransactionImportExportService.CSV_COLUMNS
        
        # 检查必需的列是否存在
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            return {
                "valid": False,
                "message": f"缺少必需的列: {', '.join(missing_columns)}"
            }
        
        # 检查是否有数据行
        if len(df) == 0:
            return {
                "valid": False,
                "message": "CSV文件没有数据行"
            }
        
        # 基本验证通过，具体的数据验证在导入过程中进行
        return {"valid": True, "message": "CSV格式正确"}

    @staticmethod
    def _check_duplicate(
        db: Session,
        transaction_time: datetime,
        amount: float,
        counterparty: str,
        item_name: str
    ) -> bool:
        """
        检查重复交易
        根据时间、金额、交易对方、商品名称判断是否为重复交易
        
        Args:
            db: 数据库会话
            transaction_time: 交易时间
            amount: 金额
            counterparty: 交易对方（已清理）
            item_name: 商品名称（已清理）
            
        Returns:
            是否为重复交易
        """
        # 基础查询条件：时间和金额
        base_query = db.query(TransactionDetail).filter(
            and_(
                TransactionDetail.transaction_time == transaction_time,
                TransactionDetail.amount == amount
            )
        )
        
        # 构建交易对方的查询条件
        counterparty_conditions = []
        
        if counterparty:
            # 精确匹配清理后的值
            counterparty_conditions.append(TransactionDetail.counterparty == counterparty)
            # 还要匹配可能存在尾随空格的版本
            counterparty_conditions.append(TransactionDetail.counterparty.like(f"{counterparty}%"))
        else:
            counterparty_conditions.append(TransactionDetail.counterparty.is_(None))
        
        # 构建商品名称的查询条件
        item_name_conditions = []
        
        if item_name:
            # 精确匹配清理后的值
            item_name_conditions.append(TransactionDetail.item_name == item_name)
            # 还要匹配可能存在尾随空格的版本
            item_name_conditions.append(TransactionDetail.item_name.like(f"{item_name}%"))
        else:
            item_name_conditions.append(TransactionDetail.item_name.is_(None))
        
        # 组合查询条件
        from sqlalchemy import or_
        
        final_query = base_query.filter(
            or_(*counterparty_conditions),
            or_(*item_name_conditions)
        )
        
        result = final_query.first()
        return result is not None

    @staticmethod
    def _refresh_financial_aggregation(db: Session):
        """
        刷新财务聚合数据
        清空现有聚合数据并重新生成
        
        Args:
            db: 数据库会话
        """
        try:
            print("🔄 开始刷新财务聚合数据...")
            
            # 清空现有聚合数据
            db.query(FinancialAggregation).delete()
            db.commit()
            
            # 重新聚合所有数据
            result = AggregationService.aggregate_monthly_data(db)
            
            print(f"✅ 财务聚合数据刷新完成: {result}")
            
        except Exception as e:
            print(f"❌ 财务聚合数据刷新失败: {str(e)}")
            db.rollback()
            raise

    @staticmethod
    def get_csv_template() -> str:
        """
        获取CSV模板
        
        Returns:
            CSV模板字符串
        """
        # 创建示例数据
        sample_data = [
            {
                "交易时间": "2024-01-15 14:30:00",
                "类型": "餐饮", 
                "金额": 25.50,
                "收支": "支出",
                "支付方式": "支付宝",
                "交易对方": "某餐厅",
                "商品名称": "午餐",
                "备注": "和同事聚餐"
            },
            {
                "交易时间": "2024-01-15 09:00:00",
                "类型": "工资", 
                "金额": 8000.00,
                "收支": "收入",
                "支付方式": "银行转账",
                "交易对方": "公司",
                "商品名称": "月工资",
                "备注": "1月份工资"
            }
        ]
        
        df = pd.DataFrame(sample_data, columns=TransactionImportExportService.CSV_COLUMNS)
        output = StringIO()
        df.to_csv(output, index=False, encoding='utf-8')
        return output.getvalue()
