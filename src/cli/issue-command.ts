import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { GitHubClient } from '../github/github-client.js';
import { IssueLinker } from '../github/issue-linker.js';
import { logger } from '../utils/logger.js';
import { spinner, heading, filePath, chalk } from '../utils/ux.js';

export async function issueCommand(issueNumber: string, repoPath?: string): Promise<void> {
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

  const github = new GitHubClient();
  const issueNum = parseInt(issueNumber, 10);
  if (isNaN(issueNum)) {
    throw new Error(`Invalid issue number: ${issueNumber}`);
  }

  const sp2 = spinner(`Fetching issue #${issueNum}...`);
  const issue = await github.getIssue(config.repoOwner ?? '', config.repoName ?? '', issueNum);
  sp2.succeed(`Fetched: ${issue.title}`);

  const sp3 = spinner('Linking to code...');
  const linker = new IssueLinker(graph);
  const link = linker.linkIssue(issue);
  sp3.succeed('Linking complete');

  console.log('\n' + heading(`Issue #${link.issue.number}: ${link.issue.title}`) + '\n');
  console.log(chalk.dim(`Keywords: ${link.keywords.join(', ')}\n`));

  if (link.relevantSymbols.length > 0) {
    console.log(heading('Related Code') + '\n');
    for (const sym of link.relevantSymbols) {
      console.log(`- ${chalk.bold(sym.name)} (${filePath(`${sym.filePath}:${sym.line}`)})`);
    }
  } else {
    console.log(chalk.dim('No related code symbols found.'));
  }
}
