# AGENTS.md

AgentText 是一个基于 AI 的文本处理项目，提供文档导入、分块、索引和智能问答功能。

## Startup Workflow

在编写代码之前：

1. **确认工作目录** 运行 `pwd`
2. **完整阅读此文件**
3. **阅读 CLAUDE.md** 了解系统规则和编码规范
4. **运行 `./init.sh`** 验证环境健康状态
5. **阅读 `feature_list.json`** 查看当前功能状态
6. **查看最近提交** 运行 `git log --oneline -5`

如果基线验证失败，先修复再添加新功能。

## Working Rules

- **一次一个功能**：从 `feature_list.json` 中选择一个未完成的功能
- **验证必须通过**：不运行验证命令不能声称完成
- **更新工件**：会话结束前更新 `progress.md` 和 `feature_list.json`
- **保持范围**：不要修改与当前功能无关的文件
- **保持干净状态**：下次会话必须能立即运行 `./init.sh`
- **错误熔断**：如果某个错误持续超过 20 分钟无法解决，将错误详情（错误信息、尝试过的方案、上下文）记录到 `报错记录.md`，然后**立即停止工作**，等待用户介入

## Required Artifacts

- `feature_list.json` — 功能状态跟踪器（真实来源）
- `progress.md` — 会话连续性日志
- `init.sh` — 标准启动和验证路径

## Definition of Done

一个功能只有在以下条件全部满足时才算完成：

- [ ] 目标行为已实现
- [ ] 必须的验证已运行（测试 / 类型检查）
- [ ] 证据已记录在 `feature_list.json` 或 `progress.md` 中
- [ ] 仓库可通过标准启动路径重新启动

## End of Session

结束会话前：

1. 更新 `progress.md` 记录当前状态
2. 更新 `feature_list.json` 记录新的功能状态
3. 记录任何未解决的风险或阻碍
4. 工作处于安全状态时提交并附带描述性消息
5. 确保仓库足够干净，下次会话可立即运行 `./init.sh`

## Verification Commands

```bash
# 完整验证（推荐）
./init.sh

# 单独检查
npm install && npm test && npm run build
```

## Escalation

如果遇到：
- **架构决策**：查阅 CLAUDE.md 或询问用户
- **需求不明确**：查阅 `docs/` 或询问用户
- **测试反复失败**：更新进度，标记为需要人工审查
- **范围模糊**：重新阅读 `feature_list.json` 了解完成定义
