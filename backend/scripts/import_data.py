#!/usr/bin/env python3
"""
数据导入脚本
用于将CSV文件导入到SQLite数据库
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal, create_tables
from app.services.data_import_service import DataImportService

def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("使用方法: python import_data.py <csv_file_path>")
        print("例子: python import_data.py ../../dataset.csv")
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
        validation_result = DataImportService.validate_csv_structure(csv_file_path)
        
        if not validation_result["valid"]:
            print(f"❌ 文件验证失败: {validation_result['message']}")
            sys.exit(1)
        
        print("✅ 文件结构验证通过")
        
        # 导入数据
        print("📥 开始导入数据...")
        import_result = DataImportService.import_csv_to_database(csv_file_path, db)
        
        if import_result["success"]:
            print(f"✅ 数据导入成功!")
            print(f"   📊 导入记录数: {import_result['imported_records']}")
            print(f"   📅 总月数: {import_result['total_months']}")
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
