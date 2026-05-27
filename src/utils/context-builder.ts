import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CodeContext, ContextFile } from '../llm/types.js';
import { logger } from './logger.js';

export interface ContextBuilderOptions {
  maxChars?: number;
  maxLines?: number;
  maxContextTokens?: number;
}

const DEFAULT_OPTIONS: Required<ContextBuilderOptions> = {
  maxChars: 400_000,
  maxLines: 100,
  maxContextTokens: 100_000,
};

export async function buildContextFromFiles(
  filePaths: string[],
  rootPath: string,
  options?: ContextBuilderOptions,
): Promise<CodeContext> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const files: ContextFile[] = [];
  let totalChars = 0;

  for (const filePath of filePaths) {
    if (totalChars >= opts.maxChars) break;

    try {
      const content = await readFile(join(rootPath, filePath), 'utf-8');
      const lines = content.split('\n');
      const truncated = lines.slice(0, opts.maxLines).join('\n');
      const addedChars = truncated.length;

      if (totalChars + addedChars > opts.maxChars) {
        const remaining = opts.maxChars - totalChars;
        files.push({
          path: filePath,
          startLine: 1,
          endLine: Math.floor(remaining / (addedChars / lines.length)),
          content: truncated.slice(0, remaining),
          relevanceScore: 1.0,
        });
        break;
      }

      files.push({
        path: filePath,
        startLine: 1,
        endLine: Math.min(lines.length, opts.maxLines),
        content: truncated,
        relevanceScore: 1.0,
      });
      totalChars += addedChars;
    } catch {
      logger.debug(`Skipping unreadable file: ${filePath}`);
    }
  }

  return { files, maxContextTokens: opts.maxContextTokens };
}
