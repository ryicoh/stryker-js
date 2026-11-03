import path from 'path';

import ts from 'typescript';
import type {
  API,
  Diagnostic,
  Snapshot,
  Program,
} from '@typescript/native/sync';
import type { createFileSystemLayer } from '@typescript/native/fs';
import { Mutant, StrykerOptions } from '@stryker-mutator/api/core';
import { Logger } from '@stryker-mutator/api/logging';

import { HybridFileSystem } from './fs/hybrid-file-system.js';
import { TSFileNode } from './grouping/ts-file-node.js';
import { ITypescriptCompiler } from './typescript-compiler.js';
import {
  determineBuildModeEnabled,
  overrideOptions,
  retrieveReferencedProjects,
  toPosixFileName,
} from './tsconfig-helpers.js';

export class NativeTypescriptCompiler implements ITypescriptCompiler {
  public readonly nodes = new Map<string, TSFileNode>();
  private readonly sources = new Map<string, ts.SourceFile>();
  private api: API | undefined;
  private snapshot: Snapshot | undefined;
  private createLayer: typeof createFileSystemLayer | undefined;

  constructor(
    private readonly log: Logger,
    private readonly options: StrykerOptions,
    private readonly fs: HybridFileSystem,
  ) {}

  public async init(): Promise<ts.Diagnostic[]> {
    const configFile = toPosixFileName(path.resolve(this.options.tsconfigFile));
    if (!ts.sys.fileExists(configFile)) {
      throw new Error(
        `The tsconfig file does not exist at: "${configFile}". Please configure the tsconfig file in your stryker.conf file using "tsconfigFile"`,
      );
    }
    const [{ API }, { createFileSystemLayer }, { isStringLiteralLikeNode }] =
      await Promise.all([
        import('@typescript/native/sync'),
        import('@typescript/native/fs'),
        import('@typescript/native/ast'),
      ]);
    this.createLayer = createFileSystemLayer;
    this.api = new API();
    try {
      const configs = this.readConfigs(configFile);
      this.snapshot = this.api.createSnapshot({
        fileSystem: createFileSystemLayer([...configs]),
        openProjects: [...configs.keys()],
        ensurePrograms: true,
      });
      const programs = this.getPrograms(this.snapshot);
      for (const program of programs) {
        for (const fileName of program.getSourceFileNames()) {
          if (
            !fileName.endsWith('.d.ts') &&
            !fileName.includes('/node_modules/')
          ) {
            this.nodes.set(fileName, new TSFileNode(fileName, [], []));
          }
        }
      }
      for (const program of programs) {
        for (const fileName of program.getSourceFileNames()) {
          const node = this.nodes.get(fileName);
          if (!node) continue;
          const source = program.getSourceFile(fileName);
          if (!source) continue;
          const references = source.externalModuleIndicator
            ? source.imports
                .filter(isStringLiteralLikeNode)
                .flatMap((specifier) => {
                  const resolved = program.getResolvedModuleFromModuleSpecifier(
                    specifier,
                    fileName,
                  );
                  return resolved ? [resolved.resolvedFileName] : [];
                })
                .concat(
                  source.referencedFiles.map((reference) =>
                    path.resolve(path.dirname(fileName), reference.fileName),
                  ),
                )
            : [...this.nodes.keys()];
          for (const reference of references) {
            const child = this.nodes.get(toPosixFileName(reference));
            if (child && child !== node && !node.children.includes(child)) {
              node.children.push(child);
              child.parents.push(node);
            }
          }
        }
      }
      this.log.debug(
        'Initialized native TypeScript checker with %s source files',
        this.nodes.size,
      );
      return [
        ...programs.flatMap((program) =>
          program
            .getConfigFileParsingDiagnostics()
            .map((diagnostic) => this.toDiagnostic(diagnostic, new Map())),
        ),
        ...this.collectErrors(this.snapshot, new Map()),
      ];
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  public check(mutants: Mutant[]): Promise<ts.Diagnostic[]> {
    if (!this.snapshot || !this.createLayer)
      throw new Error('Native TypeScript checker is not initialized');
    if (!mutants.length) return Promise.resolve([]);
    const changes = new Map<string, string>();
    for (const mutant of mutants) {
      const fileName = toPosixFileName(mutant.fileName);
      const source = this.getSource(fileName);
      const start = source.getPositionOfLineAndCharacter(
        mutant.location.start.line,
        mutant.location.start.column,
      );
      const end = source.getPositionOfLineAndCharacter(
        mutant.location.end.line,
        mutant.location.end.column,
      );
      changes.set(
        fileName,
        `${source.text.slice(0, start)}${mutant.replacement}${source.text.slice(end)}`,
      );
    }
    // Each group starts from the original program so mutations cannot leak into later checks.
    const changed = this.snapshot.update({
      fileSystem: this.createLayer([...changes]),
      ensurePrograms: true,
    });
    try {
      return Promise.resolve(this.collectErrors(changed, changes));
    } finally {
      changed.dispose();
    }
  }

  public dispose(): void {
    const api = this.api;
    this.snapshot = undefined;
    this.api = undefined;
    api?.close();
  }

  private getPrograms(snapshot: Snapshot): Program[] {
    return snapshot.getProjects().map((project) => project.program);
  }

  private collectErrors(
    snapshot: Snapshot,
    changes: Map<string, string>,
  ): ts.Diagnostic[] {
    const errors = new Map<string, ts.Diagnostic>();
    for (const program of this.getPrograms(snapshot)) {
      const diagnostics = [
        ...program.getGlobalDiagnostics(),
        ...program.getProgramDiagnostics(),
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics(),
      ];
      for (const diagnostic of diagnostics) {
        errors.set(
          JSON.stringify(diagnostic),
          this.toDiagnostic(diagnostic, changes),
        );
      }
    }
    return [...errors.values()];
  }

  private toDiagnostic(
    diagnostic: Diagnostic,
    changes: Map<string, string>,
  ): ts.Diagnostic {
    const fileName =
      diagnostic.fileName && toPosixFileName(diagnostic.fileName);
    const content = fileName && changes.get(fileName);
    return {
      code: diagnostic.code,
      category: diagnostic.category,
      messageText: diagnostic.text,
      file: fileName
        ? content === undefined
          ? this.getSource(fileName)
          : ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest)
        : undefined,
      start: fileName ? diagnostic.pos : undefined,
      length: fileName ? diagnostic.end - diagnostic.pos : undefined,
    };
  }

  private getSource(fileName: string): ts.SourceFile {
    let source = this.sources.get(fileName);
    if (!source) {
      const file = this.fs.getFile(fileName);
      if (!file) throw new Error(`Could not find ${fileName}`);
      source = ts.createSourceFile(
        fileName,
        file.content,
        ts.ScriptTarget.Latest,
      );
      this.sources.set(fileName, source);
    }
    return source;
  }

  private readConfigs(root: string): Map<string, string> {
    const configs = new Map<string, string>();
    const queue = [root];
    const buildMode = determineBuildModeEnabled(root);
    for (const fileName of queue) {
      if (configs.has(fileName)) continue;
      const file = this.fs.getFile(fileName);
      if (!file) throw new Error(`Could not find ${fileName}`);
      const parsed = ts.parseConfigFileTextToJson(fileName, file.content);
      configs.set(
        fileName,
        parsed.error ? file.content : overrideOptions(parsed, buildMode),
      );
      queue.push(
        ...retrieveReferencedProjects(parsed, path.dirname(fileName)).map(
          toPosixFileName,
        ),
      );
    }
    return configs;
  }
}
