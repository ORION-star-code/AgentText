import { GitHubClient } from '../github/github-client.js';
import { IssueLinker } from '../github/issue-linker.js';
import { spinner, heading, filePath, chalk } from '../utils/ux.js';
import { loadIndexOrThrow } from './shared.js';

export async function issueCommand(issueNumber: string, repoPath?: string): Promise<void> {
  const sp = spinner('Loading index...');
  const { graph, config } = await loadIndexOrThrow(repoPath);
  sp.succeed('Index loaded');

  const github = new GitHubClient();
  const issueNum = parseInt(issueNumber, 10);
  if (isNaN(issueNum) || issueNum <= 0 || !Number.isInteger(Number(issueNumber))) {
    throw new Error(`Invalid issue number: ${issueNumber}. Must be a positive integer.`);
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
