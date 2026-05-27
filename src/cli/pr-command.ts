import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { GitHubClient } from '../github/github-client.js';
import { PrAnalyzer } from '../github/pr-analyzer.js';
import { logger } from '../utils/logger.js';

interface PrUrlParts {
  owner: string;
  repo: string;
  prNumber: number;
}

function parsePrUrl(url: string): PrUrlParts {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error(`Invalid PR URL: ${url}. Expected format: https://github.com/owner/repo/pull/123`);
  }
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) };
}

export async function prCommand(prUrl: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  // Parse PR URL
  const { owner, repo, prNumber } = parsePrUrl(prUrl);
  logger.info(`Analyzing PR: ${owner}/${repo}#${prNumber}`);

  // Load index
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    console.error('No index found. Run "codeinsight index <repo>" first.');
    process.exit(1);
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);

  // Fetch PR diff
  const github = new GitHubClient();
  const diff = await github.getPrDiff(owner, repo, prNumber);

  // Analyze
  const analyzer = new PrAnalyzer(graph);
  const report = analyzer.analyzePr(diff);

  // Output
  console.log('\n## PR Analysis Report\n');
  console.log(`Risk Level: **${report.riskLevel.toUpperCase()}**\n`);
  console.log(report.summary);
  console.log('\n' + report.details);

  if (report.impactedFiles.length > 0) {
    console.log('\n## Potentially Impacted Files\n');
    for (const file of report.impactedFiles) {
      console.log(`- ${file}`);
    }
  }
}
