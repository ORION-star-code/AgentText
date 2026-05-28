import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @octokit/rest
const mockOctokit = {
  pulls: {
    get: vi.fn(),
    listFiles: vi.fn(),
  },
  issues: {
    get: vi.fn(),
    listForRepo: vi.fn(),
  },
  repos: {
    get: vi.fn(),
  },
};

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokit),
}));

describe('GitHubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createClient() {
    const { GitHubClient } = await import('../../../src/github/github-client.js');
    return new GitHubClient('test-token');
  }

  describe('getPrDiff', () => {
    it('should return PR diff with changed files', async () => {
      mockOctokit.pulls.get.mockResolvedValue({
        data: { title: 'Test PR', body: 'PR body' },
      });
      mockOctokit.pulls.listFiles.mockResolvedValue({
        data: [
          {
            filename: 'src/a.ts',
            status: 'modified',
            additions: 10,
            deletions: 5,
            patch: '@@ -1,5 +1,10 @@',
          },
        ],
      });

      const client = await createClient();
      const diff = await client.getPrDiff('owner', 'repo', 42);

      expect(diff.prNumber).toBe(42);
      expect(diff.title).toBe('Test PR');
      expect(diff.changedFiles).toHaveLength(1);
      expect(diff.changedFiles[0].filename).toBe('src/a.ts');
    });
  });

  describe('getIssue', () => {
    it('should return issue details', async () => {
      mockOctokit.issues.get.mockResolvedValue({
        data: {
          number: 1,
          title: 'Bug report',
          body: 'Something is broken',
          labels: [{ name: 'bug' }],
          state: 'open',
          html_url: 'https://github.com/test/repo/issues/1',
        },
      });

      const client = await createClient();
      const issue = await client.getIssue('owner', 'repo', 1);

      expect(issue.number).toBe(1);
      expect(issue.title).toBe('Bug report');
      expect(issue.labels).toEqual(['bug']);
      expect(issue.state).toBe('open');
    });
  });

  describe('listIssues', () => {
    it('should list issues filtering out pull requests', async () => {
      mockOctokit.issues.listForRepo.mockResolvedValue({
        data: [
          { number: 1, title: 'Issue 1', body: '', labels: [], state: 'open', html_url: '' },
          {
            number: 2,
            title: 'PR 2',
            body: '',
            labels: [],
            state: 'open',
            html_url: '',
            pull_request: {},
          },
        ],
      });

      const client = await createClient();
      const issues = await client.listIssues('owner', 'repo');

      expect(issues).toHaveLength(1);
      expect(issues[0].number).toBe(1);
    });
  });

  describe('getRepoInfo', () => {
    it('should return repo info', async () => {
      mockOctokit.repos.get.mockResolvedValue({
        data: {
          owner: { login: 'testuser' },
          name: 'testrepo',
          default_branch: 'main',
          description: 'A test repo',
        },
      });

      const client = await createClient();
      const info = await client.getRepoInfo('testuser', 'testrepo');

      expect(info.owner).toBe('testuser');
      expect(info.name).toBe('testrepo');
      expect(info.defaultBranch).toBe('main');
    });
  });

  describe('API error handling', () => {
    it('should propagate 401 authentication error', async () => {
      mockOctokit.pulls.get.mockRejectedValue(
        Object.assign(new Error('Bad credentials'), { status: 401 }),
      );

      const client = await createClient();
      await expect(client.getPrDiff('owner', 'repo', 1)).rejects.toThrow('Bad credentials');
    });

    it('should propagate 404 not found error', async () => {
      mockOctokit.pulls.get.mockRejectedValue(
        Object.assign(new Error('Not Found'), { status: 404 }),
      );

      const client = await createClient();
      await expect(client.getPrDiff('owner', 'repo', 999)).rejects.toThrow('Not Found');
    });

    it('should propagate 401 error for getIssue', async () => {
      mockOctokit.issues.get.mockRejectedValue(
        Object.assign(new Error('Bad credentials'), { status: 401 }),
      );

      const client = await createClient();
      await expect(client.getIssue('owner', 'repo', 1)).rejects.toThrow('Bad credentials');
    });

    it('should propagate 404 error for getIssue', async () => {
      mockOctokit.issues.get.mockRejectedValue(
        Object.assign(new Error('Not Found'), { status: 404 }),
      );

      const client = await createClient();
      await expect(client.getIssue('owner', 'repo', 999)).rejects.toThrow('Not Found');
    });
  });
});
