from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, asc
from app.models.base import FinancialRecord, Summary
from datetime import datetime, date

class FinancialService:
    """财务数据服务"""
    
    @staticmethod
    def get_all_records(db: Session, skip: int = 0, limit: int = 100) -> List[FinancialRecord]:
        """获取所有财务记录"""
        return db.query(FinancialRecord).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_records_by_year(db: Session, year: int) -> List[FinancialRecord]:
        """根据年份获取记录"""
        return db.query(FinancialRecord).filter(
            FinancialRecord.month_date.like(f"{year}%")
        ).order_by(FinancialRecord.month_date).all()
    
    @staticmethod
    def get_records_by_date_range(db: Session, start_date: str, end_date: str) -> List[FinancialRecord]:
        """根据日期范围获取记录"""
        return db.query(FinancialRecord).filter(
            FinancialRecord.month_date >= start_date,
            FinancialRecord.month_date <= end_date
        ).order_by(FinancialRecord.month_date).all()
    
    @staticmethod
    def get_summary(db: Session) -> Optional[Summary]:
        """获取汇总统计"""
        return db.query(Summary).first()
    
    @staticmethod
    def get_category_trends(db: Session, category: str) -> List[Dict[str, Any]]:
        """获取某个类别的趋势数据"""
        column_mapping = {
            "housing": FinancialRecord.housing,
            "dining": FinancialRecord.dining,
            "living": FinancialRecord.living,
            "entertainment": FinancialRecord.entertainment,
            "transportation": FinancialRecord.transportation,
            "travel": FinancialRecord.travel,
            "gifts": FinancialRecord.gifts,
            "transactions": FinancialRecord.transactions,
            "social_expenses": FinancialRecord.social_expenses,
            "salary": FinancialRecord.salary,
            "balance": FinancialRecord.balance
        }
        
        if category not in column_mapping:
            return []
        
        records = db.query(
            FinancialRecord.month_date,
            column_mapping[category]
        ).order_by(FinancialRecord.month_date).all()
        
        return [
            {"date": record[0], "value": record[1]}
            for record in records
        ]
    
    @staticmethod
    def get_monthly_expenses_breakdown(db: Session, month_date: str) -> Optional[Dict[str, Any]]:
        """获取指定月份的支出分解"""
        record = db.query(FinancialRecord).filter(
            FinancialRecord.month_date == month_date
        ).first()
        
        if not record:
            return None
        
        return {
            "month_date": record.month_date,
            "expenses": {
                "housing": abs(record.housing),
                "dining": abs(record.dining),
                "living": abs(record.living),
                "entertainment": abs(record.entertainment),
                "transportation": abs(record.transportation),
                "travel": abs(record.travel),
                "gifts": abs(record.gifts),
                "social_expenses": abs(record.social_expenses)
            },
            "income": {
                "salary": record.salary,
                "transactions": record.transactions
            },
            "balance": record.balance
        }
    
    @staticmethod
    def get_year_comparison(db: Session) -> List[Dict[str, Any]]:
        """获取年度对比数据"""
        # 获取所有年份
        years = db.query(
            func.substr(FinancialRecord.month_date, 1, 4).label('year')
        ).distinct().all()
        
        comparison_data = []
        
        for year_tuple in years:
            year = year_tuple[0]
            year_records = db.query(FinancialRecord).filter(
                FinancialRecord.month_date.like(f"{year}%")
            ).all()
            
            if year_records:
                total_expenses = sum([
                    abs(r.housing) + abs(r.dining) + abs(r.living) + 
                    abs(r.entertainment) + abs(r.transportation) + 
                    abs(r.travel) + abs(r.gifts) + abs(r.social_expenses)
                    for r in year_records
                ])
                
                total_income = sum([r.salary + r.transactions for r in year_records])
                
                comparison_data.append({
                    "year": year,
                    "total_expenses": total_expenses,
                    "total_income": total_income,
                    "net_balance": total_income - total_expenses,
                    "months_count": len(year_records)
                })
        
        return sorted(comparison_data, key=lambda x: x["year"])
    
    @staticmethod
    def get_top_expense_categories(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """获取最高支出类别排名"""
        # 计算各类别总支出
        records = db.query(FinancialRecord).all()
        
        categories = {
            "housing": sum([abs(r.housing) for r in records]),
            "dining": sum([abs(r.dining) for r in records]),
            "living": sum([abs(r.living) for r in records]),
            "entertainment": sum([abs(r.entertainment) for r in records]),
            "transportation": sum([abs(r.transportation) for r in records]),
            "travel": sum([abs(r.travel) for r in records]),
            "gifts": sum([abs(r.gifts) for r in records]),
            "social_expenses": sum([abs(r.social_expenses) for r in records])
        }
        
        # 排序并取前N个
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {"category": category, "total_amount": amount}
            for category, amount in sorted_categories[:limit]
        ]
    
    @staticmethod
    def get_balance_trend(db: Session) -> List[Dict[str, Any]]:
        """获取结余趋势"""
        records = db.query(
            FinancialRecord.month_date,
            FinancialRecord.balance
        ).order_by(FinancialRecord.month_date).all()
        
        return [
            {"date": record[0], "balance": record[1]}
            for record in records
        ]
