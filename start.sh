#!/bin/bash

# 财务可视化管理工具启动脚本

echo "🚀 启动财务可视化管理工具"

# 检查Node.js环境
echo "📦 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 检查conda是否可用
if ! command -v conda &> /dev/null; then
    echo "❌ Conda 未安装或未在PATH中，请先安装Miniconda/Anaconda"
    exit 1
fi

# 定义环境名称
ENV_NAME="visualize-balance-tool"

# 创建conda环境（如果不存在）
if ! conda env list | grep -q "^$ENV_NAME "; then
    echo "📝 创建Conda环境: $ENV_NAME..."
    conda create -n $ENV_NAME python=3.11 -y
fi

# 激活conda环境
echo "⚡ 激活Conda环境: $ENV_NAME..."
source $(conda info --base)/etc/profile.d/conda.sh
conda activate $ENV_NAME

# 验证环境
echo "✅ Python版本: $(python --version)"
echo "📍 Python路径: $(which python)"

# 设置后端
echo "🔧 设置后端环境..."
cd backend

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

# # 提示用户是否导入初始数据
# read -p "是否更新数据源? (y/n): " IMPORT_DATA
# if [[ "$IMPORT_DATA" == "y" ]]; then
#     # 如果有数据文件，导入数据
#     if [ -f "data/financial_flow.csv" ]; then
#         echo "📊 导入消费交易流水数据..."
#         python scripts/import_transaction_data.py data/financial_flow.csv
#     else
#         echo "❌ 数据文件 data/financial_flow.csv 不存在，跳过"
#         exit 1
#     fi

#     echo "🔄 聚合月度财务数据..."
#     python scripts/aggregate_data.py

#     echo "✅ 数据导入和聚合完成！"
# fi

# 设置前端
echo "🎨 设置前端环境..."
cd ../frontend

# 安装依赖
echo "📦 安装前端依赖..."
npm install
cd ..
echo "✅ 环境初始化完成"

# 提示用户是否启动服务
# read -p "是否启动服务? (y/n): " START_SERVICE
# if [[ "$START_SERVICE" != "y" ]]; then
#     echo "❌ 服务未启动"
#     conda deactivate
#     exit 0
# fi

# 启动后端服务
echo "🌐 启动后端服务..."
python backend/main.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🌐 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 服务启动完成！"
echo "📖 后端API文档: http://localhost:8000/docs"
echo "🎨 前端界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait
