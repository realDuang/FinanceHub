"""
数据聚合服务
用于将交易明细数据聚合为月度财务记录
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Dict
from datetime import datetime

from app.schemas import TransactionType
from app.models.base import TransactionDetail, FinancialAggregation


class AggregationService:
    """数据聚合服务"""

    # 动态生成类别映射：从中文值映射到英文字段名
    @classmethod
    def _get_category_mapping(cls) -> Dict[str, str]:
        """
        动态生成类别映射
        将TransactionType枚举的中文值映射到对应的英文字段名

        Returns:
            Dict[str, str]: {中文类别: 英文字段名}
        """
        return {
            transaction_type.value: transaction_type.name.lower()
            for transaction_type in TransactionType
        }

    # 获取FinancialAggregation模型的所有字段名
    @classmethod
    def _get_financial_fields(cls) -> set:
        """
        获取FinancialAggregation模型的所有可用字段名

        Returns:
            set: 所有字段名的集合
        """
        # 获取模型的所有列名，排除系统字段
        excluded_fields = {"id", "month_date", "created_at", "updated_at"}
        return {
            column.name
            for column in FinancialAggregation.__table__.columns
            if column.name not in excluded_fields
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

            # 动态获取类别映射
            category_mapping = cls._get_category_mapping()
            financial_fields = cls._get_financial_fields()

            print(f"📋 类别映射: {category_mapping}")
            print(f"📋 可用字段: {financial_fields}")

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
            print(f"📅 找到 {len(months)} 个月份需要处理")

            processed_months = 0
            updated_records = 0
            created_records = 0

            for year_month in months:
                year_val = int(year_month.year)
                month_val = int(year_month.month)

                print(f"📅 处理 {year_val}年{month_val}月...")

                # 计算该月的聚合数据
                month_data = cls._calculate_month_aggregation(
                    db, year_val, month_val, category_mapping, financial_fields
                )

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
                    cls._update_financial_record(
                        existing_record, month_data, financial_fields
                    )
                    updated_records += 1
                    print(f"✅ 更新 {year_val}年{month_val}月 记录")
                else:
                    # 创建新记录
                    new_record = cls._create_financial_record(
                        month_date, month_data, financial_fields
                    )
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
            # 添加详细错误追踪
            import traceback

            print(f"🔍 详细错误信息:\n{traceback.format_exc()}")
            return {
                "success": False,
                "message": error_msg,
                "processed_months": 0,
                "created_records": 0,
                "updated_records": 0,
            }

    @classmethod
    def _calculate_month_aggregation(
        cls,
        db: Session,
        year: int,
        month: int,
        category_mapping: Dict[str, str],
        financial_fields: set,
    ) -> Dict:
        """
        计算指定月份的聚合数据

        Args:
            db: 数据库会话
            year: 年份
            month: 月份
            category_mapping: 类别映射字典
            financial_fields: 可用的财务字段集合

        Returns:
            月度聚合数据
        """
        # 使用原生SQL查询来避免枚举转换问题
        from sqlalchemy import text

        query = text(
            """
            SELECT category, amount, income_expense_type
            FROM transaction_details
            WHERE strftime('%Y', transaction_time) = :year
            AND strftime('%m', transaction_time) = :month
        """
        )

        result = db.execute(query, {"year": str(year), "month": f"{month:02d}"})
        transactions = result.fetchall()

        print(f"🔍 找到 {len(transactions)} 笔交易记录")

        # 动态初始化聚合数据，只包含实际存在的字段
        aggregated_data = {field: 0.0 for field in financial_fields}
        total_income = 0.0
        total_expense = 0.0

        # 按类别聚合
        for transaction in transactions:
            category = transaction[0]  # category
            amount = transaction[1]  # amount
            income_expense_type = transaction[2]  # income_expense_type

            # 根据收支类型调整金额符号
            if income_expense_type == "支出":
                amount = -abs(amount)  # 支出为负值
                total_expense += abs(amount)
            elif income_expense_type == "收入":
                amount = abs(amount)  # 收入为正值
                total_income += amount

            # 动态映射到对应字段
            if category in category_mapping:
                field_name = category_mapping[category]
                # 检查字段是否在数据库模型中存在
                if field_name in financial_fields:
                    aggregated_data[field_name] += amount
                else:
                    print(f"⚠️ 字段 {field_name} 不存在于数据库模型中")
            else:
                print(f"⚠️ 未找到类别 '{category}' 的映射")

        # 计算结余
        if "balance" in financial_fields:
            aggregated_data["balance"] = total_income - total_expense

        # 计算avg_consumption和recent_avg_consumption
        if "avg_consumption" in financial_fields:
            aggregated_data["avg_consumption"] = cls._calculate_avg_consumption(
                db, year, month, aggregated_data, financial_fields
            )

        if "recent_avg_consumption" in financial_fields:
            aggregated_data["recent_avg_consumption"] = (
                cls._calculate_recent_avg_consumption(
                    db, year, month, financial_fields, aggregated_data["avg_consumption"]
                )
            )

        print(f"💰 月度汇总 - 收入: {total_income}, 支出: {total_expense}")
        # print(f"📊 聚合结果: {aggregated_data}")

        return aggregated_data

    @classmethod
    def _calculate_avg_consumption(
        cls,
        db: Session,
        year: int,
        month: int,
        aggregated_data: Dict,
        financial_fields: set,
    ) -> float:
        """
        计算平均消费
        avg_consumption = 当月除住房和人情外的所有支出 + 所有月份住房支出的平均值

        Args:
            db: 数据库会话
            year: 当前年份
            month: 当前月份
            aggregated_data: 当月聚合数据
            financial_fields: 可用的财务字段集合

        Returns:
            平均消费金额
        """
        try:
            # 1. 计算当月除住房外的所有支出
            current_month_consumption = 0.0
            included_categories = {
                "dining",
                "living",
                "entertainment",
                "transportation",
                "travel",
                "gifts",
            }

            for field in financial_fields:
                if field in included_categories:
                    field_value = aggregated_data.get(field, 0.0)
                    current_month_consumption += abs(field_value)

            print(f"🏠 当月除住房外的支出: {current_month_consumption}")

            # 2. 计算所有月份住房支出的平均值
            avg_housing_expense = cls._calculate_average_housing_expense(db)

            # 3. 计算最终的avg_consumption
            avg_consumption = current_month_consumption + avg_housing_expense

            print(f"📊 计算的avg_consumption: {avg_consumption}")

            return avg_consumption

        except Exception as e:
            print(f"❌ 计算avg_consumption失败: {str(e)}")
            return 0.0

    @classmethod
    def _calculate_average_housing_expense(cls, db: Session) -> float:
        """
        计算所有月份住房支出的平均值
        包括住房支出为0的月份，以获得真实的平均值

        Args:
            db: 数据库会话

        Returns:
            住房支出平均值
        """
        try:
            # 查询所有已聚合的住房支出数据
            housing_records = db.query(FinancialAggregation.housing).all()

            if not housing_records:
                print("📊 未找到住房支出历史数据")
                return 0.0

            # 计算所有月份的住房支出平均值（包括为0的月份）
            # 住房支出为负值，取绝对值进行计算
            total_housing_expense = sum(abs(record.housing) for record in housing_records)
            total_months = len(housing_records)
            
            avg_housing = total_housing_expense / total_months if total_months > 0 else 0.0
            
            print(f"🏠 住房支出平均值: {avg_housing}")

            return avg_housing

        except Exception as e:
            print(f"❌ 计算住房支出平均值失败: {str(e)}")
            return 0.0

    @classmethod
    def _calculate_recent_avg_consumption(
        cls, db: Session, year: int, month: int, financial_fields: set, current_month_avg: float
    ) -> float:
        """
        计算最近平均消费
        取最近三个月（包括当前月份 n, n-1, n-2）的avg_consumption的平均值

        Args:
            db: 数据库会话
            year: 当前年份
            month: 当前月份
            financial_fields: 可用的财务字段集合
            current_month_avg: 当前月份的avg_consumption

        Returns:
            最近平均消费金额
        """
        try:
            from datetime import datetime
            from dateutil.relativedelta import relativedelta

            # 构建当前月份的日期
            current_date = datetime(year, month, 1)
            
            # 收集最近三个月的avg_consumption（包括当前月份）
            recent_avg_consumptions = [current_month_avg]  # 当前月份 (n)
            
            # 查询过去两个月的记录 (n-1, n-2)
            for i in range(1, 3):  # 只查询过去2个月
                past_date = current_date - relativedelta(months=i)
                past_month_date = f"{past_date.year}/{past_date.month}/1"

                record = (
                    db.query(FinancialAggregation)
                    .filter(FinancialAggregation.month_date == past_month_date)
                    .first()
                )

                if record and hasattr(record, "avg_consumption"):
                    recent_avg_consumptions.append(record.avg_consumption)

            # 计算平均值
            if len(recent_avg_consumptions) > 0:
                recent_avg = sum(recent_avg_consumptions) / len(recent_avg_consumptions)
            else:
                recent_avg = current_month_avg  # 如果没有历史数据，使用当前月份的值

            print(
                f"📊 使用 {len(recent_avg_consumptions)} 个月的数据计算recent_avg_consumption: {recent_avg}"
            )
            print(f"📊 最近三个月数据: {recent_avg_consumptions}")

            return recent_avg

        except Exception as e:
            print(f"❌ 计算recent_avg_consumption失败: {str(e)}")
            return current_month_avg  # 出错时返回当前月份的值

    @classmethod
    def _create_financial_record(
        cls, month_date: str, month_data: Dict, financial_fields: set
    ) -> FinancialAggregation:
        """
        动态创建财务记录

        Args:
            month_date: 月份日期字符串
            month_data: 月度数据
            financial_fields: 可用的财务字段集合
        """
        # 动态构建参数字典，只包含存在的字段
        record_data = {"month_date": month_date}

        for field in financial_fields:
            record_data[field] = month_data.get(field, 0.0)

        return FinancialAggregation(**record_data)

    @classmethod
    def _update_financial_record(
        cls, record: FinancialAggregation, month_data: Dict, financial_fields: set
    ):
        """
        动态更新财务记录

        Args:
            record: 要更新的记录
            month_data: 月度数据
            financial_fields: 可用的财务字段集合
        """
        # 动态更新所有字段
        for field in financial_fields:
            if hasattr(record, field):
                setattr(record, field, month_data.get(field, 0.0))

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

        # 获取当前的类别映射信息
        category_mapping = cls._get_category_mapping()
        financial_fields = cls._get_financial_fields()

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
            "category_mapping": category_mapping,
            "available_fields": list(financial_fields),
        }
