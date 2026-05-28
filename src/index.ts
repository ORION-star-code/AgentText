#!/usr/bin/env node

import { createRequire } from 'node:module';
import { Command } from 'commander';
import { setLogLevel } from './utils/logger.js';
import { loadConfig } from './core/config.js';
import { IndexPipeline } from './index/index-pipeline.js';
import { askCommand } from './cli/ask-command.js';
import { prCommand } from './cli/pr-command.js';
import { bugCommand } from './cli/bug-command.js';
import { docsCommand } from './cli/docs-command.js';
import { callchainCommand } from './cli/callchain-command.js';
import { issueCommand } from './cli/issue-command.js';
import { success, chalk } from './utils/ux.js';
import { withErrorHandling } from './cli/shared.js';

const require = createRequire(import.meta.url);
const pkgVersion = require('../package.json').version as string;

const program = new Command();

program
  .name('codeinsight')
  .description('CodeInsight Agent - 真实代码仓库理解助手')
  .version(pkgVersion)
  .passThroughOptions()
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
  .action(
    withErrorHandling('Indexing failed', async (repo: string) => {
      const config = loadConfig(repo);
      const pipeline = new IndexPipeline();
      console.log(chalk.bold(`\nIndexing ${chalk.cyan(repo)}...\n`));
      await pipeline.run(repo, config);
      console.log('\n' + success('Indexing complete!'));
    }),
  );

program
  .command('ask <question>')
  .description('对已索引的仓库提问')
  .action(
    withErrorHandling('Query failed', async (question: string) => {
      const opts = program.opts<{ repo: string }>();
      await askCommand(question, opts.repo);
    }),
  );

program
  .command('pr <url>')
  .description('分析 PR 影响范围')
  .action(
    withErrorHandling('PR analysis failed', async (url: string) => {
      const opts = program.opts<{ repo: string }>();
      await prCommand(url, opts.repo);
    }),
  );

program
  .command('bug <description>')
  .description('帮助定位 Bug')
  .action(
    withErrorHandling('Bug localization failed', async (description: string) => {
      const opts = program.opts<{ repo: string }>();
      await bugCommand(description, opts.repo);
    }),
  );

program
  .command('docs <type>')
  .description('生成文档 (readme|architecture|api)')
  .action(
    withErrorHandling('Doc generation failed', async (type: string) => {
      const opts = program.opts<{ repo: string }>();
      await docsCommand(type, opts.repo);
    }),
  );

program
  .command('callchain <symbol>')
  .description('追踪符号的调用链')
  .action(
    withErrorHandling('Call chain analysis failed', async (symbol: string) => {
      const opts = program.opts<{ repo: string }>();
      await callchainCommand(symbol, opts.repo);
    }),
  );

program
  .command('issue <number>')
  .description('分析 GitHub Issue 并关联代码')
  .action(
    withErrorHandling('Issue analysis failed', async (number: string) => {
      const opts = program.opts<{ repo: string }>();
      await issueCommand(number, opts.repo);
    }),
  );

await program.parseAsync();
