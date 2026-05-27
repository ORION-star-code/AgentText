import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { BugLocalization } from '../analysis/bug-localization.js';
import { logger } from '../utils/logger.js';
import { spinner, heading, chalk } from '../utils/ux.js';

export async function bugCommand(description: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  const sp = spinner('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    sp.fail('No index found');
    throw new Error('No index found. Run "codeinsight index <repo>" first.');
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);
  sp.succeed('Index loaded');

  const sp2 = spinner('Localizing bug...');
  const localization = new BugLocalization(graph, {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });
  const result = await localization.localize(description, rootPath);
  sp2.succeed('Localization complete');

  console.log('\n' + heading('Bug Localization Report') + '\n');
  console.log(result);
}
