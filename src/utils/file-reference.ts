/**
 * Format a file path with line number for citation.
 * Example: formatFileRef("src/index.ts", 42) => "src/index.ts:42"
 */
export function formatFileRef(filePath: string, line: number): string {
  return `${filePath}:${line}`;
}
