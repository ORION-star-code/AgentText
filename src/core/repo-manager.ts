import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { logger } from '../utils/logger.js';
import type { RepoHandle } from './types.js';

export class RepoManager {
  async clone(url: string, branch?: string): Promise<RepoHandle> {
    const tempDir = await mkdtemp(join(tmpdir(), 'codeinsight-'));
    logger.info(`Cloning ${url} to ${tempDir}`);

    const git = simpleGit();
    const cloneArgs: string[] = [];
    if (branch) {
      cloneArgs.push('--branch', branch);
    }

    await git.clone(url, tempDir, cloneArgs);
    logger.info('Clone complete');

    return {
      rootPath: tempDir,
      remoteUrl: url,
      branch,
      isTemporary: true,
    };
  }

  async openLocal(path: string): Promise<RepoHandle> {
    const git = simpleGit(path);
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      throw new Error(`Path is not a git repository: ${path}`);
    }

    let branch: string | undefined;
    try {
      const status = await git.status();
      branch = status.current ?? undefined;
    } catch (error) {
      logger.debug(`Could not get branch info: ${error}`);
    }

    logger.info(`Opened local repo at ${path}`);

    return {
      rootPath: path,
      branch,
      isTemporary: false,
    };
  }

  async cleanup(handle: RepoHandle): Promise<void> {
    if (!handle.isTemporary) {
      logger.debug('Skipping cleanup for non-temporary repo');
      return;
    }

    logger.info(`Cleaning up temporary repo at ${handle.rootPath}`);
    await rm(handle.rootPath, { recursive: true, force: true });
  }
}
