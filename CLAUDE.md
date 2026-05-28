# AgentText 项目

## Harness 框架

本项目使用五子系统 Harness 框架确保代理跨会话可靠工作：

1. **指令层**：CLAUDE.md（本文件）+ AGENTS.md（路由层）
2. **状态层**：feature_list.json + progress.md
3. **验证层**：init.sh 初始化脚本
4. **范围层**：一次一个功能政策
5. **生命周期层**：会话启动和结束流程

**启动流程**：运行 `./init.sh` → 阅读 `feature_list.json` → 选择一个功能开始

## 项目概述
CodeInsight Agent — 真实代码仓库理解助手。让 AI 深度理解 GitHub/GitLab 仓库，回答项目运行方式、核心业务、接口调用链、影响范围分析等问题，所有回答必须带文件路径和行号引用。

## 技术栈
- 语言: TypeScript (ES2022, NodeNext)
- 运行时: Node.js 22+
- 包管理: npm
- CLI: commander
- 解析: ts-morph (TS/JS 深度分析)
- Git: simple-git
- GitHub: @octokit/rest
- LLM: @anthropic-ai/sdk (Claude API)
- 测试: vitest
- 图表: mermaid

## 编码规范
- 使用 2 空格缩进
- 变量命名使用 camelCase
- 文件名使用 kebab-case
- 每个文件不超过 300 行

## 测试
- 所有新功能必须附带测试
- 测试覆盖率不低于 80%

## Git 工作流
- 主分支: main
- 开发分支: dev/功能名
- 提交信息格式: `type(scope): description`
  - type: feat, fix, docs, style, refactor, test, chore
  - scope: 模块名
  - description: 简短描述

## 常用命令
```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 构建
npm run build
```

## 验证要求

完成任何功能前必须运行验证：

```bash
# 完整验证
./init.sh

# 单独检查
npm test && npm run build
```

## 优化量化要求

每次优化必须记录量化指标，格式如下：

```markdown
### 优化记录 - YYYY-MM-DD

**优化类型**: 死代码清理 / 重复消除 / 性能优化 / 测试强化 / 重构

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 测试用例数 | X | Y | +Z |
| 测试文件数 | X | Y | +Z |
| 源代码行数 | X | Y | -Z |
| 死代码文件 | X | Y | -Z |
| 未使用import | X | Y | -Z |
| 重复代码块 | X | Y | -Z |
| 构建时间 | X | Y | 变化% |
```

必填项：测试用例数、受影响文件数、删除/新增行数。
记录位置：`progress.md` 的优化记录章节。

## 会话结束流程

1. 更新 `progress.md` 记录当前状态
2. 更新 `feature_list.json` 记录功能状态
3. 记录未解决的风险或阻碍
4. 提交代码并附带描述性消息

## 项目结构
```
AgentText/
├── AGENTS.md              # 代理启动和工作规则
├── CLAUDE.md              # Claude Code 指令
├── feature_list.json      # 功能状态跟踪
├── progress.md            # 会话连续性日志
├── init.sh                # 初始化脚本
├── .claude/               # Claude Code 配置
│   ├── settings.json      # 项目设置
│   ├── commands/          # 自定义命令
│   └── skills/            # 自定义技能
├── .mcp.json              # MCP 服务器配置
├── src/                   # 源代码
├── tests/                 # 测试文件
└── docs/                  # 文档
```
