import { describe, it, expect } from 'vitest';
import { IssueLinker } from '../../../src/github/issue-linker.js';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import type { Issue } from '../../../src/github/types.js';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    number: 1,
    title: 'Login fails',
    body: 'Users cannot login after password reset',
    labels: ['bug'],
    state: 'open',
    url: 'https://github.com/test/repo/issues/1',
    ...overrides,
  };
}

function makeGraphWithNodes(
  nodes: { id: string; name: string; filePath: string; line: number }[],
): CodeGraph {
  const graph = new CodeGraph();
  for (const n of nodes) {
    graph.addNode(
      n.id,
      {
        name: n.name,
        kind: 'function',
        startLine: n.line,
        endLine: n.line + 5,
        startColumn: 0,
        isExported: true,
      },
      n.filePath,
    );
  }
  return graph;
}

describe('IssueLinker', () => {
  it('should extract keywords from issue', () => {
    const graph = makeGraphWithNodes([]);
    const linker = new IssueLinker(graph);
    const link = linker.linkIssue(makeIssue());
    expect(link.keywords.length).toBeGreaterThan(0);
    expect(link.issue.number).toBe(1);
  });

  it('should find relevant symbols by keyword match', () => {
    const graph = makeGraphWithNodes([
      { id: 'src/auth.ts::login', name: 'login', filePath: 'src/auth.ts', line: 10 },
      {
        id: 'src/auth.ts::resetPassword',
        name: 'resetPassword',
        filePath: 'src/auth.ts',
        line: 30,
      },
    ]);
    const linker = new IssueLinker(graph);
    const link = linker.linkIssue(
      makeIssue({
        title: 'login fails',
        body: 'the login function returns error',
      }),
    );
    // "login" should match the symbol
    const loginSym = link.relevantSymbols.find((s) => s.name === 'login');
    expect(loginSym).toBeDefined();
    expect(loginSym?.filePath).toBe('src/auth.ts');
  });

  it('should return empty symbols when no matches', () => {
    const graph = makeGraphWithNodes([
      { id: 'src/a.ts::foo', name: 'foo', filePath: 'src/a.ts', line: 1 },
    ]);
    const linker = new IssueLinker(graph);
    const link = linker.linkIssue(makeIssue({ title: 'xyzzy', body: 'nothing matches' }));
    expect(link.relevantSymbols).toHaveLength(0);
  });

  it('should deduplicate symbols', () => {
    const graph = makeGraphWithNodes([
      { id: 'src/auth.ts::login', name: 'login', filePath: 'src/auth.ts', line: 10 },
    ]);
    const linker = new IssueLinker(graph);
    const link = linker.linkIssue(makeIssue({ title: 'login login login', body: 'login issue' }));
    const loginSyms = link.relevantSymbols.filter((s) => s.name === 'login');
    expect(loginSyms).toHaveLength(1);
  });
});
