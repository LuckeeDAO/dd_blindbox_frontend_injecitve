#!/bin/bash

# DD Blindbox Frontend 项目自动上传到 GitHub 脚本
# 使用方法: ./scripts/upload_to_github.sh

set -e  # 遇到错误时退出

echo "🚀 开始上传 DD Blindbox Frontend 项目到 GitHub..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 初始化 Git 仓库（如果不存在）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

# 设置远程仓库
echo "🔗 设置远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:LuckeeDAO/dd_blindbox_frontend_injecitve.git

# 检查 Git 状态
echo "📋 检查 Git 状态..."
git status

# 添加所有修改的文件
echo "📝 添加所有修改的文件..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "feat: 完成 DD Blindbox Frontend 开发

- 实现完整的盲盒前端界面
- 支持盲盒创建、购买、开启功能
- 实现钱包连接和状态管理
- 添加管理员功能和权限控制
- 实现盲盒展示和交互逻辑
- 支持响应式设计和移动端适配
- 添加完整的用户交互体验

核心功能:
- 盲盒创建和管理界面
- 用户购买和开启盲盒
- 盲盒展示和状态管理
- 管理员权限控制界面
- 钱包连接管理
- 购买历史记录
- 盲盒结果展示

技术特性:
- Next.js 14 + TypeScript
- Tailwind CSS 样式系统
- Zustand 状态管理
- Framer Motion 动画库
- 响应式设计
- 热重载开发

UI/UX 特性:
- 直观的盲盒展示界面
- 实时购买状态更新
- 清晰的盲盒信息展示
- 流畅的用户交互
- 移动端友好设计
- 管理员控制面板

部署特性:
- Vercel 部署配置
- 环境变量管理
- 生产构建优化
- 自动化部署流程"

# 确认远程仓库设置
echo "🔗 确认远程仓库设置..."
git remote -v

# 推送代码到 GitHub
echo "⬆️  推送代码到 GitHub..."
git push -u origin main

echo "✅ 项目已成功上传到 GitHub!"

# 显示项目信息
echo ""
echo "📊 项目统计:"
echo "   - 总文件数: $(find . -type f | wc -l)"
echo "   - React组件: $(find . -name "*.tsx" | wc -l)"
echo "   - TypeScript文件: $(find . -name "*.ts" | wc -l)"
echo "   - 样式文件: $(find . -name "*.css" -o -name "*.scss" | wc -l)"
echo "   - 文档文件: $(find . -name "*.md" | wc -l)"
echo "   - 脚本文件: $(find . -name "*.sh" | wc -l)"

echo ""
echo "🎉 上传完成! 您现在可以访问 GitHub 仓库查看您的项目"
echo "📋 本次提交包含:"
echo "   - 完整的盲盒前端实现"
echo "   - 盲盒创建、购买、开启功能"
echo "   - 管理员功能和权限控制"
echo "   - 钱包连接和状态管理"
echo "   - 响应式设计和移动端适配"
echo "   - 完整的用户交互体验"
echo "   - 生产就绪的构建配置"
