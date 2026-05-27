export interface PrDiff {
  prNumber: number;
  title: string;
  body: string;
  changedFiles: ChangedFile[];
}

export interface ChangedFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: 'open' | 'closed';
  url: string;
}

export interface RepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  description: string;
}

export interface ListOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string;
  perPage?: number;
}

export interface AnalysisReport {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  changedFiles: string[];
  impactedFiles: string[];
  details: string;
}
