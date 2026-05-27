/**
 * Format a file path with line number for citation.
 * Example: formatFileRef("src/index.ts", 42) => "src/index.ts:42"
 */
export function formatFileRef(filePath: string, line: number): string {
  return `${filePath}:${line}`;
}

/**
 * Format a file path with line range.
 * Example: formatFileRange("src/index.ts", 10, 20) => "src/index.ts:10-20"
 */
export function formatFileRange(filePath: string, startLine: number, endLine: number): string {
  return `${filePath}:${startLine}-${endLine}`;
}

/**
 * Parse a "file:line" reference string.
 * Example: parseFileRef("src/index.ts:42") => { filePath: "src/index.ts", line: 42 }
 */
export function parseFileRef(ref: string): { filePath: string; line?: number } | null {
  const match = ref.match(/^(.+?)(?::(\d+))?$/);
  if (!match) return null;
  return {
    filePath: match[1],
    line: match[2] ? parseInt(match[2], 10) : undefined,
  };
}
