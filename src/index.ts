#!/usr/bin/env node

import { Command } from 'commander';
import { setLogLevel } from './utils/logger.js';
import { loadConfig } from './core/config.js';
import { IndexPipeline } from './index/index-pipeline.js';
import { askCommand } from './cli/ask-command.js';
import { prCommand } from './cli/pr-command.js';
import { bugCommand } from './cli/bug-command.js';
import { docsCommand } from './cli/docs-command.js';
import { CallChainAnalysis } from './analysis/call-chain-analysis.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('codeinsight')
  .description('CodeInsight Agent - 真实代码仓库理解助手')
  .version('0.1.0')
  .option('-v, --verbose', 'enable debug logging', false)
  .option('-r, --repo <path>', '指定仓库路径', process.cwd())
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts<{ verbose: boolean }>();
    if (opts.verbose) {
      setLogLevel('debug');
    }
  });

program
  .command('index <repo>')
  .description('解析并索引一个代码仓库')
  .action(async (repo: string) => {
    try {
      const config = loadConfig();
      const pipeline = new IndexPipeline();
      await pipeline.run(repo, config);
      console.log('Indexing complete!');
    } catch (error) {
      logger.error('Indexing failed', error);
      process.exit(1);
    }
  });

program
  .command('ask <question>')
  .description('对已索引的仓库提问')
  .action(async (question: string) => {
    try {
      const opts = program.opts<{ repo: string }>();
      await askCommand(question, opts.repo);
    } catch (error) {
      logger.error('Query failed', error);
      process.exit(1);
    }
  });

program
  .command('pr <url>')
  .description('分析 PR 影响范围')
  .action(async (url: string) => {
    try {
      const opts = program.opts<{ repo: string }>();
      await prCommand(url, opts.repo);
    } catch (error) {
      logger.error('PR analysis failed', error);
      process.exit(1);
    }
  });

program
  .command('bug <description>')
  .description('帮助定位 Bug')
  .action(async (description: string) => {
    try {
      const opts = program.opts<{ repo: string }>();
      await bugCommand(description, opts.repo);
    } catch (error) {
      logger.error('Bug localization failed', error);
      process.exit(1);
    }
  });

program
  .command('docs <type>')
  .description('生成文档 (readme|architecture|api)')
  .action(async (type: string) => {
    try {
      const opts = program.opts<{ repo: string }>();
      await docsCommand(type, opts.repo);
    } catch (error) {
      logger.error('Doc generation failed', error);
      process.exit(1);
    }
  });

program
  .command('callchain <symbol>')
  .description('追踪符号的调用链')
  .action(async (symbol: string) => {
    try {
      const opts = program.opts<{ repo: string }>();
      const config = loadConfig(opts.repo);
      const pipeline = new IndexPipeline();
      const hasIndex = await pipeline.hasIndex(opts.repo, config);
      if (!hasIndex) {
        console.error('No index found. Run "codeinsight index <repo>" first.');
        process.exit(1);
      }

      const { graph } = await pipeline.loadIndex(opts.repo, config);
      const analysis = new CallChainAnalysis(graph, {
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      });
      const result = await analysis.analyzeSymbol(symbol);
      console.log(result);
    } catch (error) {
      logger.error('Call chain analysis failed', error);
      process.exit(1);
    }
  });

// Load config to verify it works
const config = loadConfig();
if (config.logLevel === 'debug') {
  setLogLevel('debug');
}

program.parse();
