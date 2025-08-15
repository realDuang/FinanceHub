import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base

# 获取项目根目录，然后构建数据库路径
# 当前文件: backend/app/database/connection.py
# 需要返回到项目根目录
current_dir = os.path.dirname(os.path.abspath(__file__))  # backend/app/database
backend_dir = os.path.dirname(os.path.dirname(current_dir))  # backend
project_root = os.path.dirname(backend_dir)  # 项目根目录
db_path = os.path.join(project_root, "backend", "data", "financial_data.db")

# 确保数据库目录存在
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# 获取数据库URL，默认使用SQLite
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{db_path}")

print(f"数据库路径: {DATABASE_URL}")  # 调试用

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """创建所有表"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()