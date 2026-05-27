export interface KeywordExtractorOptions {
  stopWords?: Set<string>;
  minWordLength?: number;
  extractFilePatterns?: boolean;
  extractStackTraceSymbols?: boolean;
}

const DEFAULT_STOP_WORDS = new Set([
  // Common English stop words
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
  'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'and', 'or', 'but',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
  'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
  'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it',
  'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their',
  // Query-specific stop words
  'explain', 'show', 'tell', 'find', 'help', 'please',
  // Error-specific stop words
  'error', 'typeerror', 'referenceerror', 'syntaxerror',
]);

export function extractKeywords(
  text: string,
  options?: KeywordExtractorOptions,
): string[] {
  const opts: Required<KeywordExtractorOptions> = {
    stopWords: DEFAULT_STOP_WORDS,
    minWordLength: 3,
    extractFilePatterns: false,
    extractStackTraceSymbols: false,
    ...options,
  };

  const keywords: string[] = [];

  // Extract file paths (e.g., src/auth/login.ts)
  if (opts.extractFilePatterns) {
    const fileMatches = text.match(/[\w./\-]+\.\w+/g);
    if (fileMatches) keywords.push(...fileMatches);
  }

  // Extract stack trace symbols (e.g., "at UserService.createUser(")
  if (opts.extractStackTraceSymbols) {
    const stackMatches = text.match(/at\s+(\w+)\s*\(/g);
    if (stackMatches) {
      for (const match of stackMatches) {
        const name = match.replace(/at\s+/, '').replace(/\(/, '').trim();
        if (name) keywords.push(name);
      }
    }
  }

  // Extract general keywords
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/);

  for (const word of words) {
    if (word.length > opts.minWordLength && !opts.stopWords.has(word)) {
      keywords.push(word);
    }
  }

  return [...new Set(keywords)];
}
