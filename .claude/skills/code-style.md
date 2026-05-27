---
name: code-style
description: 代码风格检查和格式化技能
---

# 代码风格检查

## 检查内容
1. 缩进一致性（2 空格）
2. 命名规范（camelCase 变量，PascalCase 类名）
3. 文件长度（不超过 300 行）
4. import 顺序
5. 未使用的变量和导入

## 执行流程
1. 扫描目标文件
2. 检查代码风格问题
3. 自动修复可修复的问题
4. 报告需要手动处理的问题

## 常用命令
```bash
# ESLint 检查
npx eslint src/

# Prettier 格式化
npx prettier --write src/

# TypeScript 类型检查
npx tsc --noEmit
```
