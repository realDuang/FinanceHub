from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.models.base import FinancialAggregation


class FinancialService:
    """财务聚合数据分析服务"""

    @staticmethod
    def get_records(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "month_date",
        order_direction: str = "desc",
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

        # 排序
        order_column = getattr(
            FinancialAggregation, order_by, FinancialAggregation.month_date
        )
        if order_direction.lower() == "desc":
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(asc(order_column))

        return query.offset(skip).limit(limit).all()
