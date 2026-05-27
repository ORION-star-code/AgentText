import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { GitHubClient } from '../github/github-client.js';
import { IssueLinker } from '../github/issue-linker.js';
import { logger } from '../utils/logger.js';

export async function issueCommand(issueNumber: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  logger.info('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    throw new Error('No index found. Run "codeinsight index <repo>" first.');
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);

  // Determine owner/repo from git remote or config
  const github = new GitHubClient();
  const issueNum = parseInt(issueNumber, 10);
  if (isNaN(issueNum)) {
    throw new Error(`Invalid issue number: ${issueNumber}`);
  }

  logger.info(`Fetching issue #${issueNum}...`);
  const issue = await github.getIssue(config.repoOwner ?? '', config.repoName ?? '', issueNum);

  const linker = new IssueLinker(graph);
  const link = linker.linkIssue(issue);

  console.log(`\n## Issue #${link.issue.number}: ${link.issue.title}\n`);
  console.log(`Keywords: ${link.keywords.join(', ')}\n`);

  if (link.relevantSymbols.length > 0) {
    console.log('## Related Code\n');
    for (const sym of link.relevantSymbols) {
      console.log(`- ${sym.name} (${sym.filePath}:${sym.line})`);
    }
  } else {
    console.log('No related code symbols found.');
  }
}
