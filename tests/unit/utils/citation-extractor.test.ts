import { describe, it, expect } from 'vitest';
import { extractCitations } from '../../../src/utils/citation-extractor.js';

describe('extractCitations', () => {
  it('should extract file:line references', () => {
    const text = 'The bug is in src/auth/login.ts:42 and src/utils/db.ts:100';
    const citations = extractCitations(text);

    expect(citations).toHaveLength(2);
    expect(citations[0]).toMatchObject({ filePath: 'src/auth/login.ts', line: 42 });
    expect(citations[1]).toMatchObject({ filePath: 'src/utils/db.ts', line: 100 });
  });

  it('should extract "file (line N)" format', () => {
    const text = 'See user-service.ts (line 15) for details';
    const citations = extractCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({ filePath: 'user-service.ts', line: 15 });
  });

  it('should return empty for no citations', () => {
    const text = 'No file references here';
    const citations = extractCitations(text);

    expect(citations).toHaveLength(0);
  });

  it('should include snippets with configurable window', () => {
    const text = 'The issue is in main.ts:10 for the login flow';
    const citations = extractCitations(text, 10);

    expect(citations).toHaveLength(1);
    expect(citations[0].snippet).toContain('main.ts:10');
    expect(citations[0].snippet.length).toBeLessThanOrEqual(30);
  });

  it('should handle multiple references on same line', () => {
    const text = 'Call a.ts:1 then b.ts:2 then c.ts:3';
    const citations = extractCitations(text);

    expect(citations).toHaveLength(3);
  });
});
