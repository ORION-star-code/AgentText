import { GitHubClient } from '../github/github-client.js';
import { PrAnalyzer } from '../github/pr-analyzer.js';
import { spinner, heading, riskLevel, filePath } from '../utils/ux.js';
import { loadIndexOrThrow } from './shared.js';

interface PrUrlParts {
  owner: string;
  repo: string;
  prNumber: number;
}

function parsePrUrl(url: string): PrUrlParts {
  if (!url.startsWith('https://github.com/') && !url.startsWith('http://github.com/')) {
    throw new Error(`Invalid PR URL: must start with https://github.com/. Got: ${url}`);
  }
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error(
      `Invalid PR URL: ${url}. Expected format: https://github.com/owner/repo/pull/123`,
    );
  }
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) };
}

export async function prCommand(prUrl: string, repoPath?: string): Promise<void> {
  const { owner, repo, prNumber } = parsePrUrl(prUrl);

  const sp = spinner('Loading index...');
  const { graph } = await loadIndexOrThrow(repoPath);
  sp.succeed('Index loaded');

  const sp2 = spinner(`Fetching PR #${prNumber} from ${owner}/${repo}...`);
  const github = new GitHubClient();
  const diff = await github.getPrDiff(owner, repo, prNumber);
  sp2.succeed(`Fetched PR: ${diff.title}`);

  const sp3 = spinner('Analyzing impact...');
  const analyzer = new PrAnalyzer(graph);
  const report = analyzer.analyzePr(diff);
  sp3.succeed('Analysis complete');

  console.log('\n' + heading('PR Analysis Report') + '\n');
  console.log(`Risk Level: ${riskLevel(report.riskLevel)}\n`);
  console.log(report.summary);
  console.log('\n' + report.details);

  if (report.impactedFiles.length > 0) {
    console.log('\n' + heading('Potentially Impacted Files') + '\n');
    for (const file of report.impactedFiles) {
      console.log(`- ${filePath(file)}`);
    }
  }
}
