import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';

export interface CodeInsightConfig {
  /** Default model for Claude API */
  model: string;
  /** Max tokens for Claude responses */
  maxTokens: number;
  /** Temperature for Claude (0.0 for deterministic) */
  temperature: number;
  /** Max files to index */
  maxFiles: number;
  /** Max file size in bytes */
  maxFileSizeBytes: number;
  /** Languages to support */
  languages: string[];
  /** Index storage path */
  indexPath: string;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: CodeInsightConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.0,
  maxFiles: 10000,
  maxFileSizeBytes: 500 * 1024,
  languages: ['typescript', 'javascript', 'python', 'java', 'go'],
  indexPath: '.codeinsight/index.json',
  logLevel: 'info',
};

const CONFIG_FILE = '.codeinsight.json';

export function loadConfig(rootPath: string = process.cwd()): CodeInsightConfig {
  const configPath = resolve(rootPath, CONFIG_FILE);

  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8');
      const userConfig = JSON.parse(raw);
      logger.debug('Loaded config from', configPath);
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch (error) {
      logger.warn(`Failed to parse ${CONFIG_FILE}, using defaults`, error);
    }
  }

  return { ...DEFAULT_CONFIG };
}
