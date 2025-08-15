#!/usr/bin/env python3
"""
交易明细数据导入脚本
用于将 financial_flow.csv 文件导入到SQLite数据库
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from datetime import datetime
from app.database.connection import SessionLocal, create_tables
from app.models.base import TransactionDetail

def parse_transaction_time(time_str):
    """解析交易时间字符串"""
    if pd.isna(time_str) or time_str == '':
        return None
    
    try:
        # 解析格式如: 2022/8/1 11:56:03
        return datetime.strptime(str(time_str), '%Y/%m/%d %H:%M:%S')
    except ValueError:
        try:
            # 尝试只有日期的格式: 2022/8/1 00:00:00
            return datetime.strptime(str(time_str), '%Y/%m/%d %H:%M:%S')
        except ValueError:
            print(f"⚠️  无法解析时间格式: {time_str}")
            return None

def clean_amount(amount_str):
    """清理金额数据"""
    if pd.isna(amount_str):
        return 0.0
    
    try:
        return float(amount_str)
    except (ValueError, TypeError):
        print(f"⚠️  无法解析金额: {amount_str}")
        return 0.0

def import_transaction_data(csv_file_path: str, db_session) -> dict:
    """
    从CSV文件导入交易明细数据
    
    Args:
        csv_file_path: CSV文件路径
        db_session: 数据库会话
        
    Returns:
        导入结果统计
    """
    try:
        print("📖 读取CSV文件...")
        df = pd.read_csv(csv_file_path, encoding='utf-8')
        
        print(f"📊 文件包含 {len(df)} 条记录")
        
        # 清除现有的交易明细数据
        print("🗑️  清除现有交易明细数据...")
        db_session.query(TransactionDetail).delete()
        
        imported_count = 0
        skipped_count = 0
        
        print("💾 开始导入数据...")
        
        for index, row in df.iterrows():
            # 跳过空行
            if pd.isna(row['交易时间']):
                skipped_count += 1
                continue
            
            # 解析交易时间
            transaction_time = parse_transaction_time(row['交易时间'])
            if transaction_time is None:
                skipped_count += 1
                continue
            
            # 清理和验证数据
            amount = clean_amount(row['金额(元)'])
            
            # 创建交易记录
            transaction = TransactionDetail(
                transaction_time=transaction_time,
                category=str(row['类型']) if pd.notna(row['类型']) else '',
                amount=amount,
                income_expense_type=str(row['收/支']) if pd.notna(row['收/支']) else '',
                payment_method=str(row['支付方式']) if pd.notna(row['支付方式']) else '',
                counterparty=str(row['交易对方']) if pd.notna(row['交易对方']) else '',
                item_name=str(row['商品名称']) if pd.notna(row['商品名称']) else '',
                remarks=str(row['备注']) if pd.notna(row['备注']) else ''
            )
            
            db_session.add(transaction)
            imported_count += 1
            
            # 每1000条记录提交一次
            if imported_count % 1000 == 0:
                db_session.commit()
                print(f"✅ 已导入 {imported_count} 条记录...")
        
        # 最终提交
        db_session.commit()
        
        return {
            "success": True,
            "message": "交易明细数据导入成功",
            "imported_records": imported_count,
            "skipped_records": skipped_count,
            "total_records": len(df)
        }
        
    except Exception as e:
        db_session.rollback()
        return {
            "success": False,
            "message": f"数据导入失败: {str(e)}",
            "imported_records": 0,
            "skipped_records": 0,
            "total_records": 0
        }

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
        
        df = pd.read_csv(csv_file_path, encoding='utf-8', nrows=5)
        
        required_columns = ['交易时间', '类型', '金额(元)', '收/支', '支付方式', '交易对方', '商品名称', '备注']
        missing_columns = []
        
        for col in required_columns:
            if col not in df.columns:
                missing_columns.append(col)
        
        if missing_columns:
            return {
                "valid": False, 
                "message": f"CSV文件缺少必要的列: {', '.join(missing_columns)}"
            }
        
        return {"valid": True, "message": "CSV文件结构正确"}
        
    except Exception as e:
        return {"valid": False, "message": f"文件验证失败: {str(e)}"}

def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("使用方法: python import_transaction_data.py <csv_file_path>")
        print("例子: python import_transaction_data.py ../data/financial_flow.csv")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    # 检查文件是否存在
    if not os.path.exists(csv_file_path):
        print(f"❌ 错误: 文件 {csv_file_path} 不存在")
        sys.exit(1)
    
    print(f"📁 准备导入文件: {csv_file_path}")
    
    # 创建数据库表
    print("🔧 创建数据库表...")
    create_tables()
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        # 验证CSV文件结构
        print("🔍 验证CSV文件结构...")
        validation_result = validate_csv_structure(csv_file_path)
        
        if not validation_result["valid"]:
            print(f"❌ 文件验证失败: {validation_result['message']}")
            sys.exit(1)
        
        print("✅ 文件结构验证通过")
        
        # 导入数据
        print("📥 开始导入交易明细数据...")
        import_result = import_transaction_data(csv_file_path, db)
        
        if import_result["success"]:
            print(f"✅ 数据导入成功!")
            print(f"   📊 导入记录数: {import_result['imported_records']}")
            print(f"   ⏭️  跳过记录数: {import_result['skipped_records']}")
            print(f"   📄 总记录数: {import_result['total_records']}")
        else:
            print(f"❌ 数据导入失败: {import_result['message']}")
            sys.exit(1)
    
    except Exception as e:
        print(f"❌ 导入过程中发生错误: {str(e)}")
        sys.exit(1)
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
