import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger.js';
import type { PrDiff, ChangedFile, Issue, RepoInfo, ListOptions } from './types.js';

export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token ?? process.env.GITHUB_TOKEN,
    });
  }

  async getPrDiff(owner: string, repo: string, prNumber: number): Promise<PrDiff> {
    logger.info(`Fetching PR #${prNumber} from ${owner}/${repo}`);

    const { data: pr } = await this.octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const changedFiles: ChangedFile[] = files.map((f) => ({
      filename: f.filename,
      status: f.status as ChangedFile['status'],
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    }));

    return {
      prNumber,
      title: pr.title,
      body: pr.body ?? '',
      changedFiles,
    };
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
    const { data } = await this.octokit.issues.get({ owner, repo, issue_number: issueNumber });
    return this.mapIssue(data);
  }

  async listIssues(owner: string, repo: string, options?: ListOptions): Promise<Issue[]> {
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: options?.state ?? 'open',
      labels: options?.labels,
      per_page: options?.perPage ?? 30,
    });

    return data.filter((i) => !i.pull_request).map((d) => this.mapIssue(d));
  }

  private mapIssue(data: {
    number: number;
    title: string;
    body?: string | null;
    labels: Array<string | { name?: string }>;
    state: string;
    html_url: string;
  }): Issue {
    return {
      number: data.number,
      title: data.title,
      body: data.body ?? '',
      labels: data.labels.map((l) => (typeof l === 'string' ? l : (l.name ?? ''))),
      state: data.state as 'open' | 'closed',
      url: data.html_url,
    };
  }

  async getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
    const { data } = await this.octokit.repos.get({ owner, repo });

    return {
      owner: data.owner.login,
      name: data.name,
      defaultBranch: data.default_branch,
      description: data.description ?? '',
    };
  }
}
