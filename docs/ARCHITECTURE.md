# CodeInsight Agent - Architecture

## Overview

CodeInsight Agent is a CLI tool that deeply understands code repositories using AI. It parses source code into a graph structure, then uses Claude to answer questions with precise file:line references.

## High-Level Architecture

```
User CLI Command
       |
       v
  +-----------+
  |    CLI    |  (commander-based)
  +-----------+
       |
  +----+----+----+----+
  |    |    |    |    |
  v    v    v    v    v
index ask   pr  bug  docs
  |    |    |    |    |
  +----+----+----+----+
       |
  +----v-----------+
  | Analysis Layer |  (call chain, impact, bug, docs)
  +----+-----------+
       |
  +----v-----------+
  | LLM Layer      |  (Claude client, prompt builder)
  +----+-----------+
       |
  +----v-----------+
  | Graph Layer    |  (code graph, symbol resolver)
  +----+-----------+
       |
  +----v-----------+
  | Parser Layer   |  (ts-morph based TS/JS parser)
  +----+-----------+
       |
  +----v-----------+
  | Core Layer     |  (repo manager, file discovery, config)
  +----+-----------+
       |
  v    v    v
GitHub API  Claude API  Git
```

## Key Modules

### Core Layer (`src/core/`)
- **repo-manager.ts**: Clone/open git repositories
- **file-discovery.ts**: Walk directories, filter by language, respect .gitignore
- **config.ts**: Load project configuration
- **types.ts**: Shared type definitions

### Parser Layer (`src/parser/`)
- **typescript-parser.ts**: Parse TS/JS files using ts-morph
- **parser-registry.ts**: Map languages to parser implementations
- **types.ts**: Parser interfaces (ParsedFile, ParsedSymbol, etc.)

### Graph Layer (`src/graph/`)
- **code-graph.ts**: In-memory graph with nodes (symbols) and edges (relationships)
- **symbol-resolver.ts**: Resolve cross-file references via import/export analysis
- **call-chain-tracer.ts**: BFS/DFS traversal for call chains
- **impact-analyzer.ts**: Compute impact sets for changed code
- **types.ts**: Graph data structures

### Index Layer (`src/index/`)
- **index-pipeline.ts**: Orchestrate discover → parse → graph → store
- **index-store.ts**: Serialize/deserialize graph to JSON

### LLM Layer (`src/llm/`)
- **claude-client.ts**: Anthropic SDK wrapper with error handling
- **prompt-builder.ts**: Assemble prompts with code context and token budget
- **response-parser.ts**: Extract citations and sections from responses
- **types.ts**: LLM interfaces

### GitHub Layer (`src/github/`)
- **github-client.ts**: Octokit wrapper for PRs, issues, repos
- **pr-analyzer.ts**: Map PR diffs to graph nodes, assess risk
- **issue-linker.ts**: Link issues to code via keyword extraction

### Analysis Layer (`src/analysis/`)
- **call-chain-analysis.ts**: End-to-end call chain analysis
- **bug-localization.ts**: Error → code search → Claude analysis
- **doc-generation.ts**: Generate README, architecture diagrams, API docs

### CLI Layer (`src/cli/`)
- Commands: index, ask, pr, bug, docs, callchain

## Data Flow

### Indexing Pipeline
```
1. Clone/open repo
2. Discover files (respect .gitignore, filter by language)
3. Parse each file (ts-morph for TS/JS)
4. Build code graph (nodes = symbols, edges = calls/imports)
5. Resolve cross-file references
6. Save index to .codeinsight/index.json
```

### Question Answering
```
1. Load index from disk
2. Extract keywords from question
3. Search graph for relevant symbols
4. Read relevant file snippets
5. Build prompt with context + question
6. Call Claude API
7. Extract citations from response
8. Output formatted answer
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (ES2022, NodeNext) |
| Runtime | Node.js 22+ |
| CLI | commander |
| Parsing | ts-morph |
| Git | simple-git |
| GitHub | @octokit/rest |
| LLM | @anthropic-ai/sdk |
| Testing | vitest |

## Design Decisions

1. **In-memory graph**: Fast random access, simple serialization. Good for repos up to ~10k files.
2. **ts-morph for parsing**: Provides type resolution and error tolerance that tree-sitter cannot.
3. **JSON index storage**: Human-readable, git-diffable. Good for development.
4. **Multi-signal context retrieval**: Keyword + file path + call chain proximity. Simpler than embedding-based RAG.
5. **Mermaid for diagrams**: Text-based, version-controllable, widely supported.
