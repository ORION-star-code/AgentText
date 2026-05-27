import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('simple-git', () => ({
  simpleGit: vi.fn().mockImplementation(() => ({
    clone: vi.fn().mockResolvedValue(undefined),
    checkIsRepo: vi.fn().mockResolvedValue(true),
    status: vi.fn().mockResolvedValue({ current: 'main' }),
  })),
}));

describe('RepoManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openLocal', () => {
    it('should open a valid git repo', async () => {
      const { RepoManager } = await import('../../../src/core/repo-manager.js');
      const manager = new RepoManager();
      const handle = await manager.openLocal('/some/repo');
      expect(handle.rootPath).toBe('/some/repo');
      expect(handle.branch).toBe('main');
      expect(handle.isTemporary).toBe(false);
    });

    it('should throw for non-git path', async () => {
      const { simpleGit } = await import('simple-git');
      (simpleGit as any).mockImplementation(() => ({
        checkIsRepo: vi.fn().mockResolvedValue(false),
      }));

      const { RepoManager } = await import('../../../src/core/repo-manager.js');
      const manager = new RepoManager();
      await expect(manager.openLocal('/not/a/repo')).rejects.toThrow('not a git repository');
    });
  });

  describe('cleanup', () => {
    it('should skip cleanup for non-temporary repos', async () => {
      const { RepoManager } = await import('../../../src/core/repo-manager.js');
      const manager = new RepoManager();
      // Should not throw
      await manager.cleanup({ rootPath: '/some/path', isTemporary: false });
    });
  });
});
