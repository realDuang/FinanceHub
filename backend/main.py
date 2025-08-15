from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.database.connection import create_tables
import os

# 创建FastAPI应用实例
app = FastAPI(
    title="财务可视化管理工具 API",
    description="一个用于财务数据管理和可视化的后端API服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含API路由
app.include_router(router, prefix="/api/v1", tags=["财务管理"])

@app.on_event("startup")
async def startup_event():
    """应用启动时创建数据库表"""
    create_tables()
    print("✅ 数据库表创建完成")

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "财务可视化管理工具 API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    
    # 获取配置
    host = os.getenv("VITE_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("VITE_SERVER_PORT", 8000))
    debug = os.getenv("VITE_SERVER_DEBUG", "true").lower() == "true"

    print(f"🚀 启动服务器: http://{host}:{port}")
    print(f"📖 API文档: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        access_log=True
    )