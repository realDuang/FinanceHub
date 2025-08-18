from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, text
from app.models.base import FinancialAggregation


class FinancialService:
    """财务聚合数据分析服务"""

    @staticmethod
    def get_records(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "month_date",
        order_direction: str = "asc",
    ) -> List[FinancialAggregation]:
        """
        获取财务聚合记录

        Args:
            db: 数据库会话
            skip: 跳过记录数
            limit: 限制记录数
            order_by: 排序字段 (month_date, balance, salary, etc.)
            order_direction: 排序方向 (asc, desc)

        Returns:
            List[FinancialAggregation]: 财务聚合记录列表
        """
        query = db.query(FinancialAggregation)

        # 特殊处理 month_date 字段的排序，因为它是字符串格式的日期
        if order_by == "month_date":
            # 将字符串日期转换为日期类型进行排序
            # month_date 格式为 "YYYY/M/D" 或 "YYYY/MM/DD"
            if order_direction.lower() == "desc":
                # 使用 SQLite 的 date() 函数将字符串转换为日期进行排序
                query = query.order_by(desc(text("date(month_date)")))
            else:
                query = query.order_by(asc(text("date(month_date)")))
        else:
            # 其他字段正常排序
            order_column = getattr(
                FinancialAggregation, order_by, FinancialAggregation.month_date
            )
            if order_direction.lower() == "desc":
                query = query.order_by(desc(order_column))
            else:
                query = query.order_by(asc(order_column))

        return query.offset(skip).limit(limit).all()
