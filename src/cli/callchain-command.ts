import { CallChainAnalysis } from '../analysis/call-chain-analysis.js';
import { spinner } from '../utils/ux.js';
import { loadIndexOrThrow } from './shared.js';

export async function callchainCommand(symbol: string, repoPath?: string): Promise<void> {
  const sp = spinner('Loading index...');
  const { graph, config } = await loadIndexOrThrow(repoPath);
  sp.succeed('Index loaded');

  const sp2 = spinner(`Tracing call chain for "${symbol}"...`);
  const analysis = new CallChainAnalysis(graph, {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });
  const result = await analysis.analyzeSymbol(symbol);
  sp2.succeed('Analysis complete');
  console.log(result);
}
