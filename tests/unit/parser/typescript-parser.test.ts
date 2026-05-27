import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TypeScriptParser } from '../../../src/parser/typescript-parser.js';

const FIXTURE_DIR = join(__dirname, '../../fixtures/sample-ts-project/src');

async function parseFixture(fileName: string) {
  const parser = new TypeScriptParser();
  const content = await readFile(join(FIXTURE_DIR, fileName), 'utf-8');
  return parser.parse(fileName, content);
}

describe('TypeScriptParser', () => {
  it('should parse interfaces', async () => {
    const result = await parseFixture('types.ts');

    const iface = result.symbols.find((s) => s.name === 'User');
    expect(iface).toBeDefined();
    expect(iface!.kind).toBe('interface');
    expect(iface!.isExported).toBe(true);
    expect(iface!.startLine).toBeGreaterThan(0);
  });

  it('should parse type aliases', async () => {
    const result = await parseFixture('types.ts');

    const typeAlias = result.symbols.find((s) => s.name === 'UserRole');
    expect(typeAlias).toBeDefined();
    expect(typeAlias!.kind).toBe('type');
    expect(typeAlias!.isExported).toBe(true);
  });

  it('should parse enums', async () => {
    const result = await parseFixture('types.ts');

    const enumSym = result.symbols.find((s) => s.name === 'Status');
    expect(enumSym).toBeDefined();
    expect(enumSym!.kind).toBe('enum');
    expect(enumSym!.isExported).toBe(true);
  });

  it('should parse classes and methods', async () => {
    const result = await parseFixture('user-service.ts');

    const cls = result.symbols.find((s) => s.name === 'UserService' && s.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.isExported).toBe(true);

    const methods = result.symbols.filter(
      (s) => s.kind === 'method' && s.parentSymbol === 'UserService',
    );
    expect(methods.length).toBeGreaterThanOrEqual(4);

    const getUser = methods.find((m) => m.name === 'getUser');
    expect(getUser).toBeDefined();
    expect(getUser!.parameters).toHaveLength(1);
    expect(getUser!.parameters![0].name).toBe('id');
  });

  it('should parse imports', async () => {
    const result = await parseFixture('user-controller.ts');

    expect(result.imports.length).toBeGreaterThanOrEqual(2);

    const serviceImport = result.imports.find((i) => i.source.includes('user-service'));
    expect(serviceImport).toBeDefined();
    expect(serviceImport!.specifiers).toContain('UserService');

    const typeImport = result.imports.find((i) => i.source.includes('types'));
    expect(typeImport).toBeDefined();
    expect(typeImport!.specifiers).toContain('User');
  });

  it('should parse call expressions', async () => {
    const result = await parseFixture('user-controller.ts');

    const calls = result.callExpressions;
    expect(calls.length).toBeGreaterThan(0);

    // UserController should call service methods
    const serviceCalls = calls.filter(
      (c) => c.callerName.startsWith('UserController') && c.calleeName === 'getUser',
    );
    expect(serviceCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should parse doc comments', async () => {
    const result = await parseFixture('user-service.ts');

    const getUser = result.symbols.find(
      (s) => s.name === 'getUser' && s.kind === 'method',
    );
    expect(getUser).toBeDefined();
    expect(getUser!.docComment).toContain('Find a user by ID');
  });

  it('should parse re-exports from index.ts', async () => {
    const result = await parseFixture('index.ts');

    // index.ts re-exports from other modules - check imports are parsed
    expect(result.imports.length).toBeGreaterThanOrEqual(2);

    const controllerImport = result.imports.find((i) => i.source.includes('user-controller'));
    expect(controllerImport).toBeDefined();
    expect(controllerImport!.specifiers).toContain('UserController');

    const serviceImport = result.imports.find((i) => i.source.includes('user-service'));
    expect(serviceImport).toBeDefined();
    expect(serviceImport!.specifiers).toContain('UserService');
  });
});
