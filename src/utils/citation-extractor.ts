import type { Citation } from '../llm/types.js';

const CITATION_REGEX = /([\w./\-]+\.\w+)(?::(\d+)|\s*\(line\s*(\d+)\))/g;

export function extractCitations(text: string, snippetWindow = 30): Citation[] {
  const citations: Citation[] = [];
  let match;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const filePath = match[1];
    const line = parseInt(match[2] ?? match[3], 10);

    const start = Math.max(0, match.index - snippetWindow);
    const end = Math.min(text.length, match.index + match[0].length + snippetWindow);
    const snippet = text.slice(start, end).trim();

    citations.push({ filePath, line, snippet });
  }

  return citations;
}
