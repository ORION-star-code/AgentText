import { BugLocalization } from '../analysis/bug-localization.js';
import { spinner, heading } from '../utils/ux.js';
import { loadIndexOrThrow } from './shared.js';

export async function bugCommand(description: string, repoPath?: string): Promise<void> {
  const sp = spinner('Loading index...');
  const { graph, config, rootPath } = await loadIndexOrThrow(repoPath);
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
