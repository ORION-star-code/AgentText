#!/usr/bin/env node

import { Command } from 'commander';
import { setLogLevel } from './utils/logger.js';
import { loadConfig } from './core/config.js';

const program = new Command();

program
  .name('codeinsight')
  .description('CodeInsight Agent - 真实代码仓库理解助手')
  .version('0.1.0')
  .option('-v, --verbose', 'enable debug logging', false)
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts<{ verbose: boolean }>();
    if (opts.verbose) {
      setLogLevel('debug');
    }
  });

program
  .command('index <repo>')
  .description('解析并索引一个代码仓库')
  .action((_repo: string) => {
    console.log('index command - not yet implemented');
  });

program
  .command('ask <question>')
  .description('对已索引的仓库提问')
  .action((_question: string) => {
    console.log('ask command - not yet implemented');
  });

program
  .command('pr <url>')
  .description('分析 PR 影响范围')
  .action((_url: string) => {
    console.log('pr command - not yet implemented');
  });

program
  .command('bug <description>')
  .description('帮助定位 Bug')
  .action((_description: string) => {
    console.log('bug command - not yet implemented');
  });

program
  .command('docs <type>')
  .description('生成文档 (readme|architecture|api)')
  .action((_type: string) => {
    console.log('docs command - not yet implemented');
  });

program
  .command('callchain <symbol>')
  .description('追踪符号的调用链')
  .action((_symbol: string) => {
    console.log('callchain command - not yet implemented');
  });

// Load config to verify it works
const config = loadConfig();
if (config.logLevel === 'debug') {
  setLogLevel('debug');
}

program.parse();
