#!/bin/bash

# 财务可视化管理工具启动脚本

echo "🚀 启动财务可视化管理工具"

# 检查Python环境
echo "🐍 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查Node.js环境
echo "📦 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 设置后端
echo "🔧 设置后端环境..."
cd backend

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📝 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "⚡ 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

# 如果有数据文件，导入数据
if [ -f "data/dataset.csv" ]; then
    echo "📊 导入示例数据..."
    python scripts/import_data.py data/dataset.csv
fi

# 启动后端服务
echo "🌐 启动后端服务..."
python main.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 设置前端
echo "🎨 设置前端环境..."
cd ../frontend

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 启动前端服务
echo "🌐 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📖 后端API文档: http://localhost:8000/docs"
echo "🎨 前端界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait
