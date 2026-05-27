import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { CallChainAnalysis } from '../analysis/call-chain-analysis.js';
import { logger } from '../utils/logger.js';

export async function callchainCommand(symbol: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  logger.info('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    throw new Error('No index found. Run "codeinsight index <repo>" first.');
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);

  const analysis = new CallChainAnalysis(graph, {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });
  const result = await analysis.analyzeSymbol(symbol);
  console.log(result);
}
