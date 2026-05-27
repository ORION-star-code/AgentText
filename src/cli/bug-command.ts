import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { BugLocalization } from '../analysis/bug-localization.js';
import { logger } from '../utils/logger.js';

export async function bugCommand(description: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  logger.info('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    console.error('No index found. Run "codeinsight index <repo>" first.');
    process.exit(1);
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);

  const localization = new BugLocalization(graph);
  const result = await localization.localize(description, rootPath);

  console.log('\n## Bug Localization Report\n');
  console.log(result);
}
