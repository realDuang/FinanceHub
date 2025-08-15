"""
数据聚合服务
用于将交易明细数据聚合为月度财务记录
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Dict
from datetime import datetime

from backend.app.schemas import TransactionType
from app.models.base import TransactionDetail, FinancialAggregation


class AggregationService:
    """数据聚合服务"""

    # 类别映射：将交易类别映射到财务记录字段
    CATEGORY_MAPPING = {
      transaction_type.name: transaction_type.field_name
      for transaction_type in TransactionType
    }


    @classmethod
    def aggregate_monthly_data(
        cls, db: Session, year: int = None, month: int = None
    ) -> Dict:
        """
        聚合月度数据

        Args:
            db: 数据库会话
            year: 指定年份，None表示所有年份
            month: 指定月份，None表示所有月份

        Returns:
            聚合结果统计
        """
        try:
            print("🔄 开始聚合月度数据...")

            # 构建查询条件
            query = db.query(TransactionDetail)
            if year:
                query = query.filter(
                    extract("year", TransactionDetail.transaction_time) == year
                )
            if month:
                query = query.filter(
                    extract("month", TransactionDetail.transaction_time) == month
                )

            # 获取所有需要聚合的月份
            months_query = db.query(
                extract("year", TransactionDetail.transaction_time).label("year"),
                extract("month", TransactionDetail.transaction_time).label("month"),
            ).distinct()

            if year:
                months_query = months_query.filter(
                    extract("year", TransactionDetail.transaction_time) == year
                )
            if month:
                months_query = months_query.filter(
                    extract("month", TransactionDetail.transaction_time) == month
                )

            months = months_query.all()

            processed_months = 0
            updated_records = 0
            created_records = 0

            for year_month in months:
                year_val = int(year_month.year)
                month_val = int(year_month.month)

                print(f"📅 处理 {year_val}年{month_val}月...")

                # 计算该月的聚合数据
                month_data = cls._calculate_month_aggregation(db, year_val, month_val)

                # 构建月度日期字符串
                month_date = f"{year_val}/{month_val}/1"

                # 查找是否已存在该月的记录
                existing_record = (
                    db.query(FinancialAggregation)
                    .filter(FinancialAggregation.month_date == month_date)
                    .first()
                )

                if existing_record:
                    # 更新现有记录
                    cls._update_financial_record(existing_record, month_data)
                    updated_records += 1
                    print(f"✅ 更新 {year_val}年{month_val}月 记录")
                else:
                    # 创建新记录
                    new_record = cls._create_financial_record(month_date, month_data)
                    db.add(new_record)
                    created_records += 1
                    print(f"✅ 创建 {year_val}年{month_val}月 记录")

                processed_months += 1

            # 提交所有更改
            db.commit()

            result = {
                "success": True,
                "message": "月度数据聚合完成",
                "processed_months": processed_months,
                "created_records": created_records,
                "updated_records": updated_records,
            }

            print(f"🎉 聚合完成: {result}")
            return result

        except Exception as e:
            db.rollback()
            error_msg = f"聚合失败: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "message": error_msg,
                "processed_months": 0,
                "created_records": 0,
                "updated_records": 0,
            }

    @classmethod
    def _calculate_month_aggregation(cls, db: Session, year: int, month: int) -> Dict:
        """
        计算指定月份的聚合数据

        Args:
            db: 数据库会话
            year: 年份
            month: 月份

        Returns:
            月度聚合数据
        """
        # 查询该月所有交易
        transactions = (
            db.query(TransactionDetail)
            .filter(
                extract("year", TransactionDetail.transaction_time) == year,
                extract("month", TransactionDetail.transaction_time) == month,
            )
            .all()
        )

        # 初始化聚合数据
        aggregated_data = {field: 0.0 for field in cls.CATEGORY_MAPPING.values()}
        total_income = 0.0
        total_expense = 0.0

        # 按类别聚合
        for transaction in transactions:
            category = transaction.category
            amount = transaction.amount
            income_expense_type = transaction.income_expense_type

            # 根据收支类型调整金额符号
            if income_expense_type == "支出":
                amount = -abs(amount)  # 支出为负值
                total_expense += abs(amount)
            elif income_expense_type == "收入":
                amount = abs(amount)  # 收入为正值
                total_income += amount

            # 映射到对应字段
            if category in cls.CATEGORY_MAPPING:
                field_name = cls.CATEGORY_MAPPING[category]
                aggregated_data[field_name] += amount

        # 计算结余
        aggregated_data["balance"] = total_income - total_expense

        # 计算平均消费（暂时用总支出除以1个月）
        aggregated_data["avg_consumption"] = total_expense
        aggregated_data["recent_avg_consumption"] = total_expense

        return aggregated_data

    @classmethod
    def _create_financial_record(
        cls, month_date: str, month_data: Dict
    ) -> FinancialAggregation:
        """创建财务记录"""
        return FinancialAggregation(
            month_date=month_date,
            housing=month_data.get("housing", 0.0),
            dining=month_data.get("dining", 0.0),
            living=month_data.get("living", 0.0),
            entertainment=month_data.get("entertainment", 0.0),
            transportation=month_data.get("transportation", 0.0),
            travel=month_data.get("travel", 0.0),
            gifts=month_data.get("gifts", 0.0),
            transactions=month_data.get("transactions", 0.0),
            social_expenses=month_data.get("social_expenses", 0.0),
            salary=month_data.get("salary", 0.0),
            balance=month_data.get("balance", 0.0),
            avg_consumption=month_data.get("avg_consumption", 0.0),
            recent_avg_consumption=month_data.get("recent_avg_consumption", 0.0),
        )

    @classmethod
    def _update_financial_record(cls, record: FinancialAggregation, month_data: Dict):
        """更新财务记录"""
        record.housing = month_data.get("housing", 0.0)
        record.dining = month_data.get("dining", 0.0)
        record.living = month_data.get("living", 0.0)
        record.entertainment = month_data.get("entertainment", 0.0)
        record.transportation = month_data.get("transportation", 0.0)
        record.travel = month_data.get("travel", 0.0)
        record.gifts = month_data.get("gifts", 0.0)
        record.transactions = month_data.get("transactions", 0.0)
        record.social_expenses = month_data.get("social_expenses", 0.0)
        record.salary = month_data.get("salary", 0.0)
        record.balance = month_data.get("balance", 0.0)
        record.avg_consumption = month_data.get("avg_consumption", 0.0)
        record.recent_avg_consumption = month_data.get("recent_avg_consumption", 0.0)
        record.updated_at = datetime.utcnow()

    @classmethod
    def get_aggregation_stats(cls, db: Session) -> Dict:
        """获取聚合统计信息"""
        transaction_count = db.query(TransactionDetail).count()
        financial_record_count = db.query(FinancialAggregation).count()

        # 获取交易数据的时间范围
        earliest_transaction = db.query(
            func.min(TransactionDetail.transaction_time)
        ).scalar()
        latest_transaction = db.query(
            func.max(TransactionDetail.transaction_time)
        ).scalar()

        return {
            "transaction_detail_count": transaction_count,
            "financial_record_count": financial_record_count,
            "earliest_transaction": (
                earliest_transaction.isoformat() if earliest_transaction else None
            ),
            "latest_transaction": (
                latest_transaction.isoformat() if latest_transaction else None
            ),
            "last_aggregation": datetime.utcnow().isoformat(),
        }
