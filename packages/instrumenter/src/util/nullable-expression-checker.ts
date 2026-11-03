import path from 'node:path';

import type { types } from '@babel/core';
import ts from 'typescript';

export function createNullableExpressionChecker(
  fileName: string,
  content: string,
  tsconfigFile?: string,
): (node: types.Node) => boolean {
  if (!tsconfigFile || !/\.[cm]?tsx?$/.test(fileName)) {
    return () => false;
  }

  const configFileName = path.resolve(tsconfigFile);
  const config = ts.readConfigFile(configFileName, ts.sys.readFile);
  if (config.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(configFileName),
    undefined,
    configFileName,
  );
  if (!(parsed.options.strictNullChecks ?? parsed.options.strict)) {
    return () => false;
  }

  const absoluteFileName = path.resolve(fileName);
  const host = ts.createCompilerHost(parsed.options);
  const readFile = host.readFile.bind(host);
  host.readFile = (name) =>
    path.resolve(name) === absoluteFileName ? content : readFile(name);
  const program = ts.createProgram([absoluteFileName], parsed.options, host);
  const sourceFile = program.getSourceFile(absoluteFileName);
  if (!sourceFile) {
    return () => false;
  }

  const checker = program.getTypeChecker();
  const nullableRanges = new Set<string>();

  function recordIfNullable(expression: ts.Expression): void {
    const type =
      checker.getContextualType(expression) ??
      checker.getTypeAtLocation(expression);
    if (hasNull(type)) {
      nullableRanges.add(
        `${expression.getStart(sourceFile)}:${expression.end}`,
      );
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      node.arguments?.forEach(recordIfNullable);
    } else if (
      ts.isPropertyAssignment(node) &&
      ts.isObjectLiteralExpression(node.parent)
    ) {
      recordIfNullable(node.initializer);
    } else if (
      ts.isShorthandPropertyAssignment(node) &&
      ts.isObjectLiteralExpression(node.parent)
    ) {
      recordIfNullable(node.name);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return (node) => nullableRanges.has(`${node.start}:${node.end}`);
}

function hasNull(type: ts.Type): boolean {
  return (
    (type.flags & ts.TypeFlags.Null) !== 0 ||
    (type.isUnion() && type.types.some(hasNull))
  );
}
