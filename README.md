# CodeInsight Agent

AI 驱动的代码仓库深度理解助手。解析源码为图结构，用 Claude 回答问题并给出精确的 `file:line` 引用。

## 功能

- **仓库索引** — 自动解析 TS/JS 项目，构建符号级代码图（函数、类、接口、调用关系）
- **智能问答** — 对仓库提问，回答带 `file:line` 引用
- **调用链追踪** — 追踪 Controller → Service → Mapper 完整调用链
- **PR 影响分析** — 分析 PR 变更的影响范围和风险等级
- **Bug 定位** — 根据错误描述定位相关代码
- **文档生成** — 自动生成 README、Mermaid 架构图、API 文档
- **GitHub Issue 集成** — 关联 Issue 到代码，建议修改方案

## 快速开始

### 环境要求

- Node.js 22+
- npm
- Anthropic API Key（用于 Claude 问答功能）

### 安装

```bash
git clone https://github.com/ORION-star-code/AgentText.git
cd AgentText
npm install
npm run build
```

### 设置 API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 使用

```bash
# 索引一个仓库
npx codeinsight index /path/to/repo

# 提问
npx codeinsight ask "这个项目的认证流程是怎样的？"

# 追踪调用链
npx codeinsight callchain "UserController.createUser"

# 分析 PR
npx codeinsight pr https://github.com/owner/repo/pull/123

# 定位 Bug
npx codeinsight bug "用户登录时返回 500 错误"

# 生成文档
npx codeinsight docs readme
npx codeinsight docs architecture
npx codeinsight docs api
```

全局选项：

```bash
npx codeinsight -r /path/to/repo ask "问题"   # 指定仓库路径
npx codeinsight -v ask "问题"                   # 开启 debug 日志
```

## 工作原理

```
用户提问 → 加载索引 → 图搜索相关符号 → 读取源码片段 → 组装 Prompt → Claude 回答 → 输出带 file:line 的结果
```

### 索引流程

1. 发现源码文件（尊重 .gitignore）
2. ts-morph 解析提取符号（函数、类、接口、类型、导入、导出、调用）
3. 构建内存代码图（节点 = 符号，边 = 调用/导入/继承/实现）
4. 3-pass 符号解析（创建节点 → 解析跨文件导入 → 解析调用表达式）
5. 序列化到 `.codeinsight/index.json`

### 问答流程

1. 从问题提取关键词
2. 图搜索匹配符号（名称 + 文件路径 + 调用链邻近度）
3. 读取相关源码片段，按 token 预算截断
4. Claude 生成回答，强制要求 `file:line` 引用
5. 提取引用并格式化输出

## 架构

```
┌─────────────────────────────────────────┐
│  CLI (commander)                        │
├─────────────────────────────────────────┤
│  Analysis Layer                         │
│  (call-chain, bug-localization, docs)   │
├─────────────────────────────────────────┤
│  LLM Layer                              │
│  (Claude client, prompt builder)        │
├─────────────────────────────────────────┤
│  GitHub Layer                           │
│  (PR analyzer, issue linker)            │
├─────────────────────────────────────────┤
│  Graph Layer                            │
│  (code graph, symbol resolver, tracer)  │
├─────────────────────────────────────────┤
│  Parser Layer                           │
│  (ts-morph TS/JS parser)                │
├─────────────────────────────────────────┤
│  Core Layer                             │
│  (repo manager, file discovery, config) │
└─────────────────────────────────────────┘
```

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | TypeScript (ES2022, NodeNext) |
| 运行时 | Node.js 22+ |
| CLI | commander |
| 解析 | ts-morph |
| Git | simple-git |
| GitHub | @octokit/rest |
| LLM | @anthropic-ai/sdk (Claude) |
| 测试 | vitest |
| 图表 | Mermaid |

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run check

# 运行测试
npm test

# 测试 + 覆盖率
npm run test:coverage

# 构建
npm run build

# 开发模式运行
npm run dev -- index /path/to/repo

# 代码检查
npm run lint
npm run format
```

### 项目结构

```
src/
├── index.ts              # CLI 入口
├── core/                 # 基础层
│   ├── config.ts         # 配置加载
│   ├── repo-manager.ts   # 仓库克隆/打开
│   ├── file-discovery.ts # 文件发现与过滤
│   └── types.ts          # 共享类型
├── parser/               # 解析层
│   ├── typescript-parser.ts  # ts-morph 解析器
│   ├── parser-registry.ts    # 语言→解析器映射
│   └── types.ts              # 解析结果类型
├── graph/                # 图层
│   ├── code-graph.ts     # 内存图数据结构
│   ├── symbol-resolver.ts# 跨文件符号解析
│   ├── call-chain-tracer.ts  # 调用链追踪 (BFS/DFS)
│   ├── impact-analyzer.ts    # 影响分析
│   └── types.ts              # 图数据类型
├── index/                # 索引层
│   ├── index-pipeline.ts # 索引编排
│   └── index-store.ts    # JSON 序列化
├── llm/                  # LLM 层
│   ├── claude-client.ts  # Anthropic SDK 封装
│   ├── prompt-builder.ts # Prompt 组装与 token 预算
│   ├── response-parser.ts# 引用提取
│   └── types.ts          # LLM 接口
├── github/               # GitHub 层
│   ├── github-client.ts  # Octokit 封装
│   ├── pr-analyzer.ts    # PR 影响分析
│   └── issue-linker.ts   # Issue 代码关联
├── analysis/             # 分析层
│   ├── call-chain-analysis.ts # 调用链分析
│   ├── bug-localization.ts    # Bug 定位
│   └── doc-generation.ts      # 文档生成
├── cli/                  # CLI 命令
│   ├── ask-command.ts
│   ├── pr-command.ts
│   ├── bug-command.ts
│   └── docs-command.ts
└── utils/                # 工具
    ├── logger.ts         # 日志
    └── file-reference.ts # file:line 格式化
```

## 测试

```bash
npm test                 # 54 tests, 11 test files
npm run test:coverage    # 带覆盖率报告
```

测试覆盖：文件发现、TS 解析器、代码图、调用链追踪、影响分析、索引存储、Prompt 构建、响应解析、PR 分析、文档生成。

## 配置

在仓库根目录创建 `.codeinsight.json`：

```json
{
  "languages": ["typescript", "javascript"],
  "excludePatterns": ["**/test/**"],
  "maxFiles": 5000,
  "maxFileSize": 512000,
  "logLevel": "info"
}
```

## License

MIT
