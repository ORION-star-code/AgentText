export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'unknown';

export interface RepoHandle {
  rootPath: string;
  remoteUrl?: string;
  branch?: string;
  isTemporary: boolean;
}

export interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
  language: SupportedLanguage;
  sizeBytes: number;
}

export interface DiscoveryOptions {
  includeLanguages?: SupportedLanguage[];
  excludePatterns?: string[];
  maxFileSizeBytes?: number;
  maxFiles?: number;
}

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py', '.pyw'],
  java: ['.java'],
  go: ['.go'],
  unknown: [],
};

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '__pycache__',
  '.venv',
  'vendor',
  '.codeinsight',
  'coverage',
  '.next',
  '.nuxt',
];
