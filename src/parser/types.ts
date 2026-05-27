import type { SupportedLanguage } from '../core/types.js';

export interface ParsedFile {
  filePath: string;
  language: SupportedLanguage;
  symbols: ParsedSymbol[];
  imports: ParsedImport[];
  exports: ParsedExport[];
  callExpressions: ParsedCall[];
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional?: boolean;
  defaultValue?: string;
}

export interface ParsedSymbol {
  name: string;
  kind: 'function' | 'class' | 'method' | 'variable' | 'interface' | 'type' | 'enum';
  startLine: number;
  endLine: number;
  startColumn: number;
  docComment?: string;
  parameters?: ParameterInfo[];
  returnType?: string;
  visibility?: 'public' | 'private' | 'protected';
  isExported: boolean;
  parentSymbol?: string;
}

export interface ParsedImport {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  startLine: number;
}

export interface ParsedExport {
  name: string;
  kind: 'named' | 'default';
  startLine: number;
}

export interface ParsedCall {
  callerName: string;
  calleeName: string;
  calleeSource?: string;
  line: number;
}

export interface Parser {
  parse(filePath: string, content: string): Promise<ParsedFile>;
  supports(language: SupportedLanguage): boolean;
}
