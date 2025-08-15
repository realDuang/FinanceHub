import pandas as pd
import os
from typing import Optional
from sqlalchemy.orm import Session
from app.models.base import FinancialRecord, Summary
from app.database.connection import get_db

class DataImportService:
    """数据导入服务"""
    
    @staticmethod
    def import_csv_to_database(csv_file_path: str, db: Session) -> dict:
        """
        从CSV文件导入数据到数据库
        
        Args:
            csv_file_path: CSV文件路径
            db: 数据库会话
            
        Returns:
            导入结果统计
        """
        try:
            # 读取CSV文件（不设置header，以便正确读取第一行的月数信息）
            df = pd.read_csv(csv_file_path, encoding='utf-8', header=None)
            
            # 获取列头（第二行是实际的列名）
            column_names = df.iloc[1].tolist()
            
            # 获取月数信息（第一行第二列）
            total_months = df.iloc[0, 1] if pd.notna(df.iloc[0, 1]) else 0
            
            # 获取数据行（从第2行开始，跳过最后的空行和总计行）
            data_rows = df.iloc[2:-2]  # 跳过前两行（月数和列头）和最后两行（空行和总计）
            
            imported_count = 0
            
            # 清除现有数据
            db.query(FinancialRecord).delete()
            db.query(Summary).delete()
            
            # 导入每月数据
            for index, row in data_rows.iterrows():
                if pd.isna(row.iloc[0]) or row.iloc[0] == '':
                    continue
                    
                record = FinancialRecord(
                    month_date=str(row.iloc[0]),
                    housing=float(row.iloc[1]) if pd.notna(row.iloc[1]) else 0.0,
                    dining=float(row.iloc[2]) if pd.notna(row.iloc[2]) else 0.0,
                    living=float(row.iloc[3]) if pd.notna(row.iloc[3]) else 0.0,
                    entertainment=float(row.iloc[4]) if pd.notna(row.iloc[4]) else 0.0,
                    transportation=float(row.iloc[5]) if pd.notna(row.iloc[5]) else 0.0,
                    travel=float(row.iloc[6]) if pd.notna(row.iloc[6]) else 0.0,
                    gifts=float(row.iloc[7]) if pd.notna(row.iloc[7]) else 0.0,
                    transactions=float(row.iloc[8]) if pd.notna(row.iloc[8]) else 0.0,
                    social_expenses=float(row.iloc[9]) if pd.notna(row.iloc[9]) else 0.0,
                    salary=float(row.iloc[10]) if pd.notna(row.iloc[10]) else 0.0,
                    balance=float(row.iloc[11]) if pd.notna(row.iloc[11]) else 0.0,
                    avg_consumption=float(row.iloc[12]) if pd.notna(row.iloc[12]) else 0.0,
                    recent_avg_consumption=float(row.iloc[13]) if pd.notna(row.iloc[13]) else 0.0,
                )
                
                db.add(record)
                imported_count += 1
            
            # 获取总计行数据（倒数第一行）
            total_row = df.iloc[-1]
            
            # 创建汇总记录
            summary = Summary(
                total_months=int(total_months),
                total_housing=float(total_row.iloc[1]) if pd.notna(total_row.iloc[1]) else 0.0,
                total_dining=float(total_row.iloc[2]) if pd.notna(total_row.iloc[2]) else 0.0,
                total_living=float(total_row.iloc[3]) if pd.notna(total_row.iloc[3]) else 0.0,
                total_entertainment=float(total_row.iloc[4]) if pd.notna(total_row.iloc[4]) else 0.0,
                total_transportation=float(total_row.iloc[5]) if pd.notna(total_row.iloc[5]) else 0.0,
                total_travel=float(total_row.iloc[6]) if pd.notna(total_row.iloc[6]) else 0.0,
                total_gifts=float(total_row.iloc[7]) if pd.notna(total_row.iloc[7]) else 0.0,
                total_transactions=float(total_row.iloc[8]) if pd.notna(total_row.iloc[8]) else 0.0,
                total_social_expenses=float(total_row.iloc[9]) if pd.notna(total_row.iloc[9]) else 0.0,
                total_salary=float(total_row.iloc[10]) if pd.notna(total_row.iloc[10]) else 0.0,
                total_balance=float(total_row.iloc[11]) if pd.notna(total_row.iloc[11]) else 0.0,
                total_avg_consumption=float(total_row.iloc[12]) if pd.notna(total_row.iloc[12]) else 0.0,
            )
            
            db.add(summary)
            db.commit()
            
            return {
                "success": True,
                "message": "数据导入成功",
                "imported_records": imported_count,
                "total_months": total_months
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"数据导入失败: {str(e)}",
                "imported_records": 0,
                "total_months": 0
            }
    
    @staticmethod
    def validate_csv_structure(csv_file_path: str) -> dict:
        """
        验证CSV文件结构
        
        Args:
            csv_file_path: CSV文件路径
            
        Returns:
            验证结果
        """
        try:
            if not os.path.exists(csv_file_path):
                return {"valid": False, "message": "文件不存在"}
            
            df = pd.read_csv(csv_file_path, encoding='utf-8', header=None)
            
            if len(df) < 3:
                return {"valid": False, "message": "CSV文件行数不足"}
            
            # 检查必要的列数
            if len(df.columns) < 14:
                return {"valid": False, "message": "CSV文件列数不足"}
            
            return {"valid": True, "message": "CSV文件结构正确"}
            
        except Exception as e:
            return {"valid": False, "message": f"文件验证失败: {str(e)}"}
