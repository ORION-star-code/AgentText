---
name: git-workflow
description: Git 工作流管理技能
---

# Git 工作流

## 分支策略
- `main`: 生产分支，始终可部署
- `dev/功能名`: 功能开发分支
- `fix/问题号`: Bug 修复分支
- `release/版本号`: 发布分支

## 提交规范
格式: `type(scope): description`

类型:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码风格（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 工作流程
1. 从 main 创建功能分支
2. 开发并提交代码
3. 推送并创建 PR
4. 代码审查通过后合并
5. 删除功能分支

## 常用命令
```bash
# 创建功能分支
git checkout -b dev/feature-name

# 提交代码
git add .
git commit -m "feat(module): add new feature"

# 推送分支
git push origin dev/feature-name

# 合并到 main
git checkout main
git merge dev/feature-name
```
