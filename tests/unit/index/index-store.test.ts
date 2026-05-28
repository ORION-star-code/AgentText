import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import { IndexStore } from '../../../src/index/index-store.js';
import type { ParsedSymbol } from '../../../src/parser/types.js';

function makeSymbol(name: string): ParsedSymbol {
  return {
    name,
    kind: 'function',
    startLine: 1,
    endLine: 10,
    startColumn: 0,
    isExported: true,
  };
}

describe('IndexStore', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `codeinsight-store-test-${Date.now()}`);
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should save and load index', async () => {
    const store = new IndexStore();
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');
    graph.addEdge({ type: 'calls', source: 'a.ts::foo', target: 'a.ts::bar', line: 5 });

    const indexPath = join(testDir, 'index.json');
    await store.save(graph, indexPath, '/test/repo');

    const { graph: loaded, metadata } = await store.load(indexPath);

    expect(loaded.nodeCount()).toBe(2);
    expect(loaded.edgeCount()).toBe(1);
    expect(metadata.repoPath).toBe('/test/repo');
    expect(metadata.nodeCount).toBe(2);
    expect(metadata.fileCount).toBe(1);
  });

  it('should check if index exists', async () => {
    const store = new IndexStore();

    expect(await store.exists(join(testDir, 'nonexistent.json'))).toBe(false);

    const indexPath = join(testDir, 'exists.json');
    const graph = new CodeGraph();
    await store.save(graph, indexPath, '/test');

    expect(await store.exists(indexPath)).toBe(true);
  });

  it('should throw on corrupt/invalid JSON file', async () => {
    const store = new IndexStore();
    const corruptPath = join(testDir, 'corrupt.json');
    await writeFile(corruptPath, 'not valid json {{{', 'utf-8');

    await expect(store.load(corruptPath)).rejects.toThrow();
  });

  it('should throw on empty file', async () => {
    const store = new IndexStore();
    const emptyPath = join(testDir, 'empty.json');
    await writeFile(emptyPath, '', 'utf-8');

    await expect(store.load(emptyPath)).rejects.toThrow();
  });
});
