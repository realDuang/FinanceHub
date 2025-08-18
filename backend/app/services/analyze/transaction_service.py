from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, asc, and_, or_
from app.models.base import TransactionDetail


class TransactionService:
    """消费流水分析服务"""

    @staticmethod
    def get_records(
        db: Session,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        categories: Optional[List[str]] = None,
        income_expense_types: Optional[List[str]] = None,
        payment_methods: Optional[List[str]] = None,
        counterparties: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        keyword: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "transaction_time",
        order_direction: str = "desc",
    ) -> Dict[str, Any]:
        """
        根据多种条件筛选交易记录

        Args:
            db: 数据库会话
            start_date: 开始日期 (格式: YYYY-MM-DD)
            end_date: 结束日期 (格式: YYYY-MM-DD)
            categories: 交易类型列表 (如: ["住房", "餐饮"])
            income_expense_types: 收支类型列表 (如: ["收入", "支出"])
            payment_methods: 支付方式列表 (如: ["支付宝", "微信"])
            counterparties: 交易对方列表
            min_amount: 最小金额
            max_amount: 最大金额
            keyword: 关键词搜索 (在商品名称、备注中搜索)
            skip: 跳过记录数
            limit: 限制记录数
            order_by: 排序字段 (transaction_time, amount, category)
            order_direction: 排序方向 (asc, desc)

        Returns:
            Dict: 包含 records, total, filters_applied 等信息
        """
        query = db.query(TransactionDetail)
        filters_applied = []

        # 日期范围筛选
        if start_date:
            query = query.filter(TransactionDetail.transaction_time >= start_date)
            filters_applied.append(f"开始日期: {start_date}")

        if end_date:
            query = query.filter(TransactionDetail.transaction_time <= end_date)
            filters_applied.append(f"结束日期: {end_date}")

        # 交易类型筛选
        if categories:
            query = query.filter(TransactionDetail.category.in_(categories))
            filters_applied.append(f"交易类型: {', '.join(categories)}")

        # 收支类型筛选
        if income_expense_types:
            query = query.filter(
                TransactionDetail.income_expense_type.in_(income_expense_types)
            )
            filters_applied.append(f"收支类型: {', '.join(income_expense_types)}")

        # 支付方式筛选
        if payment_methods:
            # 过滤掉 None 值
            non_null_methods = [
                method for method in payment_methods if method is not None
            ]
            if non_null_methods:
                query = query.filter(
                    TransactionDetail.payment_method.in_(non_null_methods)
                )
                filters_applied.append(f"支付方式: {', '.join(non_null_methods)}")

        # 交易对方筛选
        if counterparties:
            # 过滤掉 None 值
            non_null_counterparties = [cp for cp in counterparties if cp is not None]
            if non_null_counterparties:
                query = query.filter(
                    TransactionDetail.counterparty.in_(non_null_counterparties)
                )
                filters_applied.append(
                    f"交易对方: {', '.join(non_null_counterparties)}"
                )

        # 金额范围筛选
        if min_amount is not None:
            query = query.filter(TransactionDetail.amount >= min_amount)
            filters_applied.append(f"最小金额: {min_amount}")

        if max_amount is not None:
            query = query.filter(TransactionDetail.amount <= max_amount)
            filters_applied.append(f"最大金额: {max_amount}")

        # 关键词搜索
        if keyword:
            keyword_filter = or_(
                TransactionDetail.item_name.like(f"%{keyword}%"),
                TransactionDetail.remarks.like(f"%{keyword}%"),
                TransactionDetail.counterparty.like(f"%{keyword}%"),
            )
            query = query.filter(keyword_filter)
            filters_applied.append(f"关键词: {keyword}")

        # 获取总数
        total = query.count()

        # 排序
        order_column = getattr(
            TransactionDetail, order_by, TransactionDetail.transaction_time
        )
        if order_direction.lower() == "desc":
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(asc(order_column))

        # 分页
        records = query.offset(skip).limit(limit).all()

        return {
            "records": records,
            "total": total,
            "filters_applied": filters_applied,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": total > (skip + limit),
            },
        }
