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

            # 提交第一阶段的更改
            db.commit()
            
            # 第二阶段：更新avg_consumption和recent_avg_consumption字段
            print("🔄 开始第二阶段：更新avg_consumption和recent_avg_consumption...")
            second_stage_updated_records = cls._update_derived_consumption_fields(db, year, month)
            
            # 提交第二阶段的更改
            db.commit()

            result = {
                "success": True,
                "message": "月度数据聚合完成",
                "processed_months": processed_months,
                "created_records": created_records,
                "updated_records": updated_records,
                "recent_updated_records": second_stage_updated_records,
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

        # 第一阶段只计算基础聚合数据，avg_consumption和recent_avg_consumption都在第二阶段计算
        if "avg_consumption" in financial_fields:
            aggregated_data["avg_consumption"] = 0.0  # 临时设为0，第二阶段更新

        if "recent_avg_consumption" in financial_fields:
            aggregated_data["recent_avg_consumption"] = 0.0  # 临时设为0，第二阶段更新

        print(f"💰 月度汇总 - 收入: {total_income}, 支出: {total_expense}")
        # print(f"📊 聚合结果: {aggregated_data}")

        return aggregated_data

    @classmethod
    def _update_derived_consumption_fields(cls, db: Session, year: int = None, month: int = None) -> int:
        """
        第二阶段：更新所有记录的avg_consumption和recent_avg_consumption字段
        基于已聚合完成的基础数据计算这两个派生字段

        Args:
            db: 数据库会话
            year: 指定年份，None表示所有年份
            month: 指定月份，None表示所有月份

        Returns:
            更新的记录数
        """
        try:
            print("🔄 开始第二阶段：更新派生的消费字段...")
            
            # 构建查询条件
            query = db.query(FinancialAggregation)
            
            if year and month:
                # 如果指定了年月，只更新特定月份
                month_date = f"{year}/{month}/1"
                query = query.filter(FinancialAggregation.month_date == month_date)
            elif year:
                # 如果只指定年份，更新该年份的所有月份
                query = query.filter(FinancialAggregation.month_date.like(f"{year}/%"))
            
            records = query.order_by(FinancialAggregation.month_date).all()
            
            # 第一步：计算住房支出平均值（基于已聚合的数据）
            avg_housing_expense = cls._calculate_housing_average_from_aggregated_data(db)
            print(f"🏠 从聚合数据计算住房支出平均值: {avg_housing_expense}")
            
            updated_count = 0
            
            # 第二步：更新每条记录的avg_consumption
            for record in records:
                try:
                    parts = record.month_date.split('/')
                    record_year = int(parts[0])
                    record_month = int(parts[1])
                    
                    # 计算该记录的avg_consumption
                    avg_consumption = cls._calculate_avg_consumption_from_record(
                        record, avg_housing_expense
                    )
                    
                    # 更新记录
                    record.avg_consumption = avg_consumption
                    print(f"✅ 更新 {record_year}/{record_month} 的avg_consumption: {avg_consumption}")
                    
                except (ValueError, IndexError) as e:
                    print(f"⚠️ 解析月份日期失败: {record.month_date}, 错误: {e}")
                    continue
            
            # 先提交avg_consumption的更新
            db.commit()
            
            # 第三步：更新每条记录的recent_avg_consumption
            for record in records:
                try:
                    parts = record.month_date.split('/')
                    record_year = int(parts[0])
                    record_month = int(parts[1])
                    
                    # 计算该记录的recent_avg_consumption
                    recent_avg = cls._calculate_recent_avg_consumption(
                        db, record_year, record_month, record.avg_consumption
                    )
                    
                    # 更新记录
                    record.recent_avg_consumption = recent_avg
                    updated_count += 1
                    
                    print(f"✅ 更新 {record_year}/{record_month} 的recent_avg_consumption: {recent_avg}")
                    
                except (ValueError, IndexError) as e:
                    print(f"⚠️ 解析月份日期失败: {record.month_date}, 错误: {e}")
                    continue
            
            print(f"📊 完成派生字段更新，共更新 {updated_count} 条记录")
            return updated_count
            
        except Exception as e:
            print(f"❌ 更新派生字段失败: {str(e)}")
            import traceback
            print(f"🔍 详细错误信息:\n{traceback.format_exc()}")
            return 0

    @classmethod
    def _calculate_housing_average_from_aggregated_data(cls, db: Session) -> float:
        """
        从已聚合的数据计算住房支出平均值
        
        Args:
            db: 数据库会话
            
        Returns:
            住房支出平均值
        """
        try:
            # 获取所有记录的总月份数
            total_months_count = db.query(FinancialAggregation).count()
            
            if total_months_count == 0:
                print("📊 未找到任何聚合记录")
                return 0.0
            
            # 获取所有住房支出数据
            housing_records = db.query(FinancialAggregation.housing).all()
            
            # 计算住房支出总额（只取负值，即实际支出）
            total_housing_expense = 0.0
            for record in housing_records:
                housing_amount = record.housing if record.housing is not None else 0.0
                if housing_amount < 0:  # 支出为负值
                    total_housing_expense += abs(housing_amount)
            
            # 用所有月份数计算平均值
            avg_housing = total_housing_expense / total_months_count if total_months_count > 0 else 0.0
            
            print(f"🏠 住房支出统计:")
            print(f"   - 总月份数: {total_months_count}")
            print(f"   - 住房支出总额: {total_housing_expense}")
            print(f"   - 住房支出平均值: {avg_housing}")
            
            return avg_housing
            
        except Exception as e:
            print(f"❌ 从聚合数据计算住房平均值失败: {str(e)}")
            return 0.0

    @classmethod
    def _calculate_avg_consumption_from_record(cls, record: FinancialAggregation, avg_housing_expense: float) -> float:
        """
        根据聚合记录计算avg_consumption
        avg_consumption = 当月除住房和人情外的所有支出 + 住房支出平均值
        
        Args:
            record: 财务聚合记录
            avg_housing_expense: 住房支出平均值
            
        Returns:
            平均消费金额
        """
        try:
            # 计算当月除住房和人情外的所有支出
            current_month_consumption = 0.0
            
            # 包含的支出类别
            included_categories = [
                'dining', 'living', 'entertainment', 
                'transportation', 'travel', 'gifts'
            ]
            
            for category in included_categories:
                if hasattr(record, category):
                    field_value = getattr(record, category, 0.0)
                    if field_value is not None and field_value < 0:  # 支出为负值
                        current_month_consumption += abs(field_value)
            
            # 最终的avg_consumption = 当月消费 + 住房平均值
            avg_consumption = current_month_consumption + avg_housing_expense
            
            return avg_consumption
            
        except Exception as e:
            print(f"❌ 计算avg_consumption失败: {str(e)}")
            return 0.0

    @classmethod
    def _calculate_recent_avg_consumption(
        cls, db: Session, year: int, month: int, current_month_avg: float
    ) -> float:
        """
        基于已聚合的数据计算最近三个月的平均消费
        取最近三个月（包括当前月份 n, n-1, n-2）的avg_consumption的平均值

        Args:
            db: 数据库会话
            year: 当前年份
            month: 当前月份
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
            
            print(f"📊 计算 {year}/{month} 的recent_avg_consumption")
            print(f"📊 当前月份avg_consumption: {current_month_avg}")
            
            # 查询过去两个月的记录 (n-1, n-2)
            for i in range(1, 3):  # 查询过去2个月
                past_date = current_date - relativedelta(months=i)
                past_month_date = f"{past_date.year}/{past_date.month}/1"
                
                record = (
                    db.query(FinancialAggregation)
                    .filter(FinancialAggregation.month_date == past_month_date)
                    .first()
                )

                if record and record.avg_consumption is not None and record.avg_consumption > 0:
                    recent_avg_consumptions.append(record.avg_consumption)
                    print(f"📊 找到 {past_date.year}/{past_date.month} 的avg_consumption: {record.avg_consumption}")
                else:
                    print(f"📊 未找到 {past_date.year}/{past_date.month} 的有效avg_consumption数据")

            # 计算平均值
            if len(recent_avg_consumptions) > 0:
                recent_avg = sum(recent_avg_consumptions) / len(recent_avg_consumptions)
            else:
                recent_avg = current_month_avg  # 如果没有历史数据，使用当前月份的值

            print(f"📊 使用 {len(recent_avg_consumptions)} 个月的数据: {recent_avg_consumptions}")
            print(f"📊 计算结果recent_avg_consumption: {recent_avg}")

            return recent_avg

        except Exception as e:
            print(f"❌ 计算recent_avg_consumption失败: {str(e)}")
            import traceback
            print(f"🔍 详细错误信息:\n{traceback.format_exc()}")
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
