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
  /** GitHub repo owner (for issue/PR commands) */
  repoOwner?: string;
  /** GitHub repo name (for issue/PR commands) */
  repoName?: string;
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
      return validateConfig({ ...DEFAULT_CONFIG, ...userConfig });
    } catch (error) {
      logger.warn(`Failed to parse ${CONFIG_FILE}, using defaults`, error);
    }
  }

  return { ...DEFAULT_CONFIG };
}

export function validateConfig(config: CodeInsightConfig): CodeInsightConfig {
  if (typeof config.model !== 'string' || config.model.length === 0) {
    throw new Error('Config: model must be a non-empty string');
  }
  if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
    throw new Error('Config: maxTokens must be a positive number');
  }
  if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
    throw new Error('Config: temperature must be between 0 and 1');
  }
  if (typeof config.maxFiles !== 'number' || config.maxFiles < 1) {
    throw new Error('Config: maxFiles must be a positive number');
  }
  if (typeof config.maxFileSizeBytes !== 'number' || config.maxFileSizeBytes < 1) {
    throw new Error('Config: maxFileSizeBytes must be a positive number');
  }
  if (!Array.isArray(config.languages)) {
    throw new Error('Config: languages must be an array');
  }
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new Error(`Config: logLevel must be one of: ${validLogLevels.join(', ')}`);
  }
  return config;
}
