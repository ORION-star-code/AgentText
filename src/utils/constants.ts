export const MAX_CONTEXT_CHARS = 400_000;
export const MAX_CONTEXT_TOKENS = 100_000;
export const DEFAULT_MAX_LINES = 100;
export const DEFAULT_FILE_BATCH_SIZE = 16;
export const MAX_IMPACT_DEPTH = 3;
export const MAX_SEARCH_RESULTS = 20;
export const MAX_LINKED_SYMBOLS = 20;

export const RISK_THRESHOLDS = {
  high: { impactedFiles: 10, totalChanges: 500 },
  medium: { impactedFiles: 3, totalChanges: 100 },
} as const;
