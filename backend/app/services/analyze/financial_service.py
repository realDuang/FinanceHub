from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, text
from app.models.base import FinancialAggregation
from datetime import datetime


class FinancialService:
    """财务聚合数据分析服务"""

    @staticmethod
    def get_records(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "month_date",
        order_direction: str = "asc",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[FinancialAggregation]:
        """
        获取财务聚合记录

        Args:
            db: 数据库会话
            skip: 跳过记录数
            limit: 限制记录数
            order_by: 排序字段 (month_date, balance, salary, etc.)
            order_direction: 排序方向 (asc, desc)
            start_date: 开始日期，格式：YYYY-MM-DD
            end_date: 结束日期，格式：YYYY-MM-DD

        Returns:
            List[FinancialAggregation]: 财务聚合记录列表
        """
        query = db.query(FinancialAggregation)

        # 日期范围过滤 - 先获取所有数据，然后在Python中进行过滤
        all_records = query.all()

        # 如果有日期过滤条件，在Python中进行过滤
        if start_date or end_date:
            filtered_records = []
            for record in all_records:
                try:
                    # 解析数据库中的日期格式 "YYYY/M/D"
                    record_date = datetime.strptime(record.month_date, "%Y/%m/%d")
                except ValueError:
                    # 如果解析失败，尝试其他格式
                    try:
                        record_date = datetime.strptime(record.month_date, "%Y/%m/%d")
                    except ValueError:
                        continue

                # 检查日期范围
                include_record = True
                if start_date:
                    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                    if record_date < start_dt:
                        include_record = False

                if end_date and include_record:
                    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                    if record_date > end_dt:
                        include_record = False

                if include_record:
                    filtered_records.append(record)

            all_records = filtered_records

        # 排序处理
        if order_by == "month_date":
            # 按日期排序
            if order_direction.lower() == "desc":
                all_records.sort(
                    key=lambda x: datetime.strptime(x.month_date, "%Y/%m/%d"),
                    reverse=True,
                )
            else:
                all_records.sort(
                    key=lambda x: datetime.strptime(x.month_date, "%Y/%m/%d")
                )
        else:
            # 其他字段排序
            reverse_order = order_direction.lower() == "desc"
            all_records.sort(
                key=lambda x: getattr(x, order_by, 0), reverse=reverse_order
            )

        # 分页处理
        start_index = skip
        end_index = skip + limit
        return all_records[start_index:end_index]
