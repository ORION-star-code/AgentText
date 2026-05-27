import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import ignore from 'ignore';
import { logger } from '../utils/logger.js';
import {
  LANGUAGE_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  type DiscoveredFile,
  type DiscoveryOptions,
  type SupportedLanguage,
} from './types.js';

const EXT_TO_LANGUAGE = new Map<string, SupportedLanguage>();
for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
  for (const ext of exts) {
    EXT_TO_LANGUAGE.set(ext, lang as SupportedLanguage);
  }
}

export class FileDiscovery {
  async discover(rootPath: string, options?: DiscoveryOptions): Promise<DiscoveredFile[]> {
    const maxFileSize = options?.maxFileSizeBytes ?? 500 * 1024;
    const maxFiles = options?.maxFiles ?? 10000;

    const ig = await this.buildIgnoreFilter(rootPath, options?.excludePatterns);
    const files: DiscoveredFile[] = [];

    await this.walkDir(rootPath, rootPath, ig, options, maxFileSize, maxFiles, files);

    logger.info(`Discovered ${files.length} files in ${rootPath}`);
    return files;
  }

  private async buildIgnoreFilter(
    rootPath: string,
    extraPatterns?: string[],
  ): Promise<ReturnType<typeof ignore>> {
    const ig = ignore();

    for (const pattern of DEFAULT_EXCLUDE_PATTERNS) {
      ig.add(pattern);
    }

    if (extraPatterns) {
      ig.add(extraPatterns);
    }

    try {
      const gitignoreContent = await readFile(join(rootPath, '.gitignore'), 'utf-8');
      ig.add(gitignoreContent);
    } catch {
      // No .gitignore, that's fine
    }

    return ig;
  }

  private async walkDir(
    rootPath: string,
    currentPath: string,
    ig: ReturnType<typeof ignore>,
    options: DiscoveryOptions | undefined,
    maxFileSize: number,
    maxFiles: number,
    result: DiscoveredFile[],
  ): Promise<void> {
    if (result.length >= maxFiles) return;

    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (result.length >= maxFiles) break;

      const fullPath = join(currentPath, entry.name);
      const relativePath = relative(rootPath, fullPath).replace(/\\/g, '/');

      if (ig.ignores(relativePath)) continue;

      if (entry.isDirectory()) {
        await this.walkDir(rootPath, fullPath, ig, options, maxFileSize, maxFiles, result);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = extname(entry.name).toLowerCase();
      const language = EXT_TO_LANGUAGE.get(ext);
      if (!language) continue;

      if (options?.includeLanguages && !options.includeLanguages.includes(language)) continue;

      try {
        const fileStat = await stat(fullPath);
        if (fileStat.size > maxFileSize) continue;

        result.push({
          relativePath,
          absolutePath: fullPath,
          language,
          sizeBytes: fileStat.size,
        });
      } catch {
        logger.debug(`Skipping unreadable file: ${fullPath}`);
      }
    }
  }
}
