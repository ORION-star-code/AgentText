import { Project, SyntaxKind, Node } from 'ts-morph';
import type {
  ParsedFile,
  ParsedSymbol,
  ParsedImport,
  ParsedExport,
  ParsedCall,
  ParameterInfo,
  Parser,
} from './types.js';
import type { SupportedLanguage } from '../core/types.js';

export class TypeScriptParser implements Parser {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { target: 99 },
    });
  }

  supports(language: SupportedLanguage): boolean {
    return language === 'typescript' || language === 'javascript';
  }

  async parse(filePath: string, content: string): Promise<ParsedFile> {
    const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });

    const symbols: ParsedSymbol[] = [];
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const callExpressions: ParsedCall[] = [];

    // Parse imports
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const specifiers: string[] = [];

      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        specifiers.push(defaultImport.getText());
      }

      const namedImports = importDecl.getNamedImports();
      for (const named of namedImports) {
        specifiers.push(named.getName());
      }

      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        specifiers.push(namespaceImport.getText());
      }

      imports.push({
        source: moduleSpecifier,
        specifiers,
        isDefault: !!defaultImport,
        startLine: importDecl.getStartLineNumber(),
      });
    }

    // Parse re-exports (export { X } from './y')
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      const specifiers: string[] = [];
      const namedExports = exportDecl.getNamedExports();
      for (const named of namedExports) {
        specifiers.push(named.getName());
      }

      if (specifiers.length > 0) {
        imports.push({
          source: moduleSpecifier,
          specifiers,
          isDefault: false,
          startLine: exportDecl.getStartLineNumber(),
        });
      }
    }

    // Parse exported declarations
    const exportedDecls = sourceFile.getExportedDeclarations();
    for (const [name, decls] of exportedDecls) {
      for (const decl of decls) {
        exports.push({
          name,
          kind: decl.getKind() === SyntaxKind.DefaultKeyword ? 'default' : 'named',
          startLine: decl.getStartLineNumber(),
        });
      }
    }

    // Parse functions
    for (const func of sourceFile.getFunctions()) {
      const name = func.getName() ?? 'anonymous';
      const isExported = func.isExported();

      symbols.push({
        name,
        kind: 'function',
        startLine: func.getStartLineNumber(),
        endLine: func.getEndLineNumber(),
        startColumn: 0,
        docComment:
          func
            .getJsDocs()
            .map((d) => d.getDescription())
            .join('\n') || undefined,
        parameters: func.getParameters().map(mapParameter),
        returnType: func.getReturnType().getText(),
        isExported,
      });

      // Parse call expressions inside function
      this.collectCallExpressions(func, `${name}`, callExpressions);
    }

    // Parse classes
    for (const cls of sourceFile.getClasses()) {
      const name = cls.getName() ?? 'anonymous';
      const isExported = cls.isExported();

      symbols.push({
        name,
        kind: 'class',
        startLine: cls.getStartLineNumber(),
        endLine: cls.getEndLineNumber(),
        startColumn: 0,
        docComment:
          cls
            .getJsDocs()
            .map((d) => d.getDescription())
            .join('\n') || undefined,
        isExported,
      });

      // Parse methods
      for (const method of cls.getMethods()) {
        const methodName = method.getName();
        const visibility = method.getScope();

        symbols.push({
          name: methodName,
          kind: 'method',
          startLine: method.getStartLineNumber(),
          endLine: method.getEndLineNumber(),
          startColumn: 0,
          docComment:
            method
              .getJsDocs()
              .map((d) => d.getDescription())
              .join('\n') || undefined,
          parameters: method.getParameters().map(mapParameter),
          returnType: method.getReturnType().getText(),
          visibility: visibility as 'public' | 'private' | 'protected' | undefined,
          isExported,
          parentSymbol: name,
        });

        // Parse call expressions inside method
        this.collectCallExpressions(method, `${name}.${methodName}`, callExpressions);
      }

      // Parse properties
      for (const prop of cls.getProperties()) {
        const propName = prop.getName();
        symbols.push({
          name: propName,
          kind: 'variable',
          startLine: prop.getStartLineNumber(),
          endLine: prop.getEndLineNumber(),
          startColumn: 0,
          isExported,
          parentSymbol: name,
        });
      }
    }

    // Parse interfaces
    for (const iface of sourceFile.getInterfaces()) {
      symbols.push({
        name: iface.getName(),
        kind: 'interface',
        startLine: iface.getStartLineNumber(),
        endLine: iface.getEndLineNumber(),
        startColumn: 0,
        docComment:
          iface
            .getJsDocs()
            .map((d) => d.getDescription())
            .join('\n') || undefined,
        isExported: iface.isExported(),
      });
    }

    // Parse type aliases
    for (const typeAlias of sourceFile.getTypeAliases()) {
      symbols.push({
        name: typeAlias.getName(),
        kind: 'type',
        startLine: typeAlias.getStartLineNumber(),
        endLine: typeAlias.getEndLineNumber(),
        startColumn: 0,
        isExported: typeAlias.isExported(),
      });
    }

    // Parse enums
    for (const enumDecl of sourceFile.getEnums()) {
      symbols.push({
        name: enumDecl.getName(),
        kind: 'enum',
        startLine: enumDecl.getStartLineNumber(),
        endLine: enumDecl.getEndLineNumber(),
        startColumn: 0,
        isExported: enumDecl.isExported(),
      });
    }

    // Parse top-level variable statements
    for (const varStmt of sourceFile.getVariableStatements()) {
      for (const decl of varStmt.getDeclarations()) {
        symbols.push({
          name: decl.getName(),
          kind: 'variable',
          startLine: decl.getStartLineNumber(),
          endLine: decl.getEndLineNumber(),
          startColumn: 0,
          isExported: varStmt.isExported(),
        });
      }
    }

    // Clean up the in-memory source file
    this.project.removeSourceFile(sourceFile);

    return {
      filePath,
      language: 'typescript',
      symbols,
      imports,
      exports,
      callExpressions,
    };
  }

  private collectCallExpressions(node: Node, callerName: string, result: ParsedCall[]): void {
    node.forEachDescendant((desc) => {
      if (Node.isCallExpression(desc)) {
        const expression = desc.getExpression();
        let calleeName: string;

        if (Node.isPropertyAccessExpression(expression)) {
          calleeName = expression.getName();
        } else if (Node.isIdentifier(expression)) {
          calleeName = expression.getText();
        } else {
          return;
        }

        result.push({
          callerName,
          calleeName,
          line: desc.getStartLineNumber(),
        });
      }
    });
  }
}

function mapParameter(param: {
  getName: () => string;
  getType: () => { getText: () => string };
  isOptional?: () => boolean;
  hasInitializer?: () => boolean;
}): ParameterInfo {
  return {
    name: param.getName(),
    type: param.getType().getText(),
    isOptional: param.isOptional?.() ?? false,
  };
}
