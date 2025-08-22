"""
清空数据库表脚本
用于清空 FinancialAggregation 和 TransactionDetail 表的所有数据
"""

import sys
import os
from sqlalchemy.orm import Session

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models.base import FinancialAggregation, TransactionDetail


def clear_tables():
    """清空 FinancialAggregation 和 TransactionDetail 表"""
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        print("🔄 开始清空数据表...")
        
        # 查询当前数据量
        transaction_count = db.query(TransactionDetail).count()
        aggregation_count = db.query(FinancialAggregation).count()
        
        print(f"📊 当前数据量:")
        print(f"   - TransactionDetail: {transaction_count} 条记录")
        print(f"   - FinancialAggregation: {aggregation_count} 条记录")
        
        if transaction_count == 0 and aggregation_count == 0:
            print("✅ 表已经是空的，无需清空")
            return
        
        # 确认操作
        print("\n⚠️  警告：此操作将永久删除以下表的所有数据：")
        print("   - TransactionDetail (交易明细)")
        print("   - FinancialAggregation (财务聚合)")
        
        confirm = input("\n确认继续吗？(输入 'yes' 确认): ")
        
        if confirm.lower() != 'yes':
            print("❌ 操作已取消")
            return
        
        print("\n🗑️  开始清空表数据...")
        
        # 清空 FinancialAggregation 表
        deleted_aggregation = db.query(FinancialAggregation).delete()
        print(f"✅ FinancialAggregation: 删除了 {deleted_aggregation} 条记录")
        
        # 清空 TransactionDetail 表
        deleted_transaction = db.query(TransactionDetail).delete()
        print(f"✅ TransactionDetail: 删除了 {deleted_transaction} 条记录")
        
        # 提交事务
        db.commit()
        
        print("\n🎉 数据清空完成！")
        print("💡 提示：可以使用导入功能重新导入数据")
        
    except Exception as e:
        print(f"❌ 清空数据时发生错误: {str(e)}")
        db.rollback()
        raise
        
    finally:
        db.close()


def clear_specific_table(table_name: str):
    """清空指定的表"""
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        print(f"🔄 开始清空 {table_name} 表...")
        
        if table_name.lower() == "transactiondetail":
            model = TransactionDetail
            display_name = "TransactionDetail (交易明细)"
        elif table_name.lower() == "financialaggregation":
            model = FinancialAggregation
            display_name = "FinancialAggregation (财务聚合)"
        else:
            print(f"❌ 不支持的表名: {table_name}")
            print("支持的表名: TransactionDetail, FinancialAggregation")
            return
        
        # 查询当前数据量
        count = db.query(model).count()
        print(f"📊 当前 {display_name} 有 {count} 条记录")
        
        if count == 0:
            print("✅ 表已经是空的，无需清空")
            return
        
        # 确认操作
        print(f"\n⚠️  警告：此操作将永久删除 {display_name} 的所有数据")
        confirm = input("确认继续吗？(输入 'yes' 确认): ")
        
        if confirm.lower() != 'yes':
            print("❌ 操作已取消")
            return
        
        # 删除数据
        deleted_count = db.query(model).delete()
        db.commit()
        
        print(f"✅ {display_name}: 删除了 {deleted_count} 条记录")
        print("🎉 操作完成！")
        
    except Exception as e:
        print(f"❌ 清空 {table_name} 时发生错误: {str(e)}")
        db.rollback()
        raise
        
    finally:
        db.close()


def show_table_stats():
    """显示表的统计信息"""
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        print("📊 数据库表统计信息:")
        print("-" * 50)
        
        # TransactionDetail 统计
        transaction_count = db.query(TransactionDetail).count()
        print(f"TransactionDetail (交易明细): {transaction_count} 条记录")
        
        if transaction_count > 0:
            # 获取时间范围
            earliest = db.query(TransactionDetail.transaction_time).order_by(TransactionDetail.transaction_time.asc()).first()
            latest = db.query(TransactionDetail.transaction_time).order_by(TransactionDetail.transaction_time.desc()).first()
            if earliest and latest:
                print(f"  时间范围: {earliest[0]} 到 {latest[0]}")
        
        # FinancialAggregation 统计
        aggregation_count = db.query(FinancialAggregation).count()
        print(f"FinancialAggregation (财务聚合): {aggregation_count} 条记录")
        
        if aggregation_count > 0:
            # 获取月份范围
            earliest_month = db.query(FinancialAggregation.month_date).order_by(FinancialAggregation.month_date.asc()).first()
            latest_month = db.query(FinancialAggregation.month_date).order_by(FinancialAggregation.month_date.desc()).first()
            if earliest_month and latest_month:
                print(f"  月份范围: {earliest_month[0]} 到 {latest_month[0]}")
        
        print("-" * 50)
        
    except Exception as e:
        print(f"❌ 获取统计信息时发生错误: {str(e)}")
        
    finally:
        db.close()


def main():
    """主函数"""
    
    if len(sys.argv) == 1:
        # 没有参数，显示帮助信息
        print("📚 数据库表清空脚本")
        print("-" * 30)
        print("用法:")
        print("  python clear_tables.py [选项]")
        print()
        print("选项:")
        print("  all                    - 清空所有表 (TransactionDetail + FinancialAggregation)")
        print("  transaction           - 只清空 TransactionDetail 表")
        print("  aggregation           - 只清空 FinancialAggregation 表")
        print("  stats                 - 显示表统计信息")
        print()
        print("示例:")
        print("  python clear_tables.py all")
        print("  python clear_tables.py transaction")
        print("  python clear_tables.py stats")
        return
    
    command = sys.argv[1].lower()
    
    if command == "all":
        clear_tables()
    elif command in ["transaction", "transactiondetail"]:
        clear_specific_table("TransactionDetail")
    elif command in ["aggregation", "financialaggregation"]:
        clear_specific_table("FinancialAggregation")
    elif command == "stats":
        show_table_stats()
    else:
        print(f"❌ 未知的命令: {command}")
        print("支持的命令: all, transaction, aggregation, stats")
        print("使用 'python clear_tables.py' 查看帮助")


if __name__ == "__main__":
    main()
