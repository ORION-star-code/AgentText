export interface CodeContext {
  files: ContextFile[];
  graphSummary?: string;
  maxContextTokens: number;
}

export interface ContextFile {
  path: string;
  startLine: number;
  endLine: number;
  content: string;
  relevanceScore: number;
}

export interface ClaudeResponse {
  answer: string;
  citations: Citation[];
  tokensUsed: { input: number; output: number };
}

export interface Citation {
  filePath: string;
  line: number;
  snippet: string;
}

export type DocType = 'readme' | 'architecture' | 'api';
