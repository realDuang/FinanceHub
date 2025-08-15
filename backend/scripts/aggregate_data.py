#!/usr/bin/env python3
"""
数据聚合脚本
用于将交易明细数据聚合为月度财务记录
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal, create_tables
from app.services.aggregation_service import AggregationService

def main():
    """主函数"""
    print("📊 数据聚合工具")
    print("="*50)
    
    # 创建数据库表（如果不存在）
    print("🔧 确保数据库表已创建...")
    create_tables()
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        # 显示聚合前的统计信息
        print("\n📈 聚合前统计信息:")
        stats = AggregationService.get_aggregation_stats(db)
        print(f"   交易明细记录数: {stats['transaction_detail_count']}")
        print(f"   财务记录数: {stats['financial_record_count']}")
        print(f"   最早交易时间: {stats['earliest_transaction']}")
        print(f"   最晚交易时间: {stats['latest_transaction']}")
        
        # 执行聚合
        print("\n🔄 开始执行聚合...")
        result = AggregationService.aggregate_monthly_data(db)
        
        if result["success"]:
            print(f"\n✅ 聚合成功完成!")
            print(f"   处理月份数: {result['processed_months']}")
            print(f"   创建记录数: {result['created_records']}")
            print(f"   更新记录数: {result['updated_records']}")
        else:
            print(f"\n❌ 聚合失败: {result['message']}")
            sys.exit(1)
        
        # 显示聚合后的统计信息
        print("\n📈 聚合后统计信息:")
        stats = AggregationService.get_aggregation_stats(db)
        print(f"   交易明细记录数: {stats['transaction_detail_count']}")
        print(f"   财务记录数: {stats['financial_record_count']}")
        
        print(f"\n🎉 数据聚合完成!")
        
    except Exception as e:
        print(f"❌ 聚合过程中发生错误: {str(e)}")
        sys.exit(1)
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
