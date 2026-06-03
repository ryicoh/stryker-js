import babel from '@babel/core';
import { parse, ParserPlugin } from '@babel/parser';
import generator from '@babel/generator';
import { expect } from 'chai';

import { NodeMutator } from '../../src/mutators/node-mutator.js';

const generate = generator.default;

const plugins = [
  'doExpressions',
  'objectRestSpread',
  'classProperties',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'asyncGenerators',
  'functionBind',
  'functionSent',
  'dynamicImport',
  'numericSeparator',
  'importMeta',
  'optionalCatchBinding',
  'optionalChaining',
  'classPrivateProperties',
  ['pipelineOperator', { proposal: 'minimal' }],
  'nullishCoalescingOperator',
  'bigInt',
  'throwExpressions',
  'logicalAssignment',
  'classPrivateMethods',
  'v8intrinsic',
  'partialApplication',
  ['decorators', { decoratorsBeforeExport: false }],
  'jsx',
  'typescript',
] as ParserPlugin[];

export function expectJSMutation(
  sut: NodeMutator,
  originalCode: string,
  ...expectedReplacements: string[]
): void {
  const sourceFileName = 'source.js';
  const ast = parse(originalCode, {
    sourceFilename: sourceFileName,
    plugins,
    sourceType: 'module',
  });
  const mutants: string[] = [];
  const originalNodeSet = nodeSet(ast);

  babel.traverse(ast, {
    enter(path) {
      for (const replacement of sut.mutate(path)) {
        const mutatedCode = generate(replacement).code;
        const isRemoval = replacement.type === 'Noop';
        const [cutStart, cutEnd] = isRemoval
          ? expandRemovalRange(
              originalCode,
              path.node.start ?? 0,
              path.node.end ?? 0,
            )
          : [path.node.start ?? 0, path.node.end ?? 0];
        const beforeMutatedCode = originalCode.substring(0, cutStart);
        const afterMutatedCode = originalCode.substring(cutEnd);
        const mutant = `${beforeMutatedCode}${mutatedCode}${afterMutatedCode}`;
        mutants.push(mutant);

        for (const replacementNode of nodeSet(replacement, path)) {
          if (originalNodeSet.has(replacementNode)) {
            expect.fail(
              `Mutated ${replacementNode.type} node \`${
                generate(replacementNode).code
              }\` was found in the original AST. Please be sure to deep clone it (using \`cloneNode(ast, true)\`)`,
            );
          }
        }
      }
    },
  });

  /* because we know mutants and expectedReplacements are strings */
  mutants.sort();
  expectedReplacements.sort();

  expect(mutants).to.deep.equal(expectedReplacements);
}

// Compute the source range to cut when removing a property. Includes the
// trailing comma + line break + leading indentation when the property sits on
// its own line, or the trailing comma + single space for inline properties. If
// the removed property is the last one in the literal, the leading comma is
// swallowed instead so we don't leave `{ a, }`.
function expandRemovalRange(
  source: string,
  start: number,
  end: number,
): [number, number] {
  // First try to swallow trailing comma + line break (multi-line case).
  let cutEnd = end;
  let trailingComma = false;
  if (source[cutEnd] === ',') {
    cutEnd++;
    trailingComma = true;
  }
  let sawTrailingNewline = false;
  let i = cutEnd;
  while (source[i] === ' ' || source[i] === '\t') i++;
  if (source[i] === '\r') {
    i++;
    sawTrailingNewline = true;
  }
  if (source[i] === '\n') {
    i++;
    sawTrailingNewline = true;
  }
  if (sawTrailingNewline) {
    cutEnd = i;
    // Drop the line indentation that introduced the removed property.
    let cutStart = start;
    while (cutStart > 0 && (source[cutStart - 1] === ' ' || source[cutStart - 1] === '\t')) {
      cutStart--;
    }
    return [cutStart, cutEnd];
  }
  if (trailingComma) {
    // Inline `, b`: also eat the single space following the comma.
    if (source[cutEnd] === ' ') cutEnd++;
    return [start, cutEnd];
  }
  // No trailing comma — this is the last property. Swallow the preceding
  // comma plus its surrounding whitespace instead.
  let cutStart = start;
  while (cutStart > 0 && /\s/.test(source[cutStart - 1])) cutStart--;
  if (cutStart > 0 && source[cutStart - 1] === ',') {
    cutStart--;
    // For inline literals keep the single space before the previous property's
    // comma (e.g. `{ a: 1, b: 2 }` → `{ a: 1 }`). For multi-line literals strip
    // the trailing whitespace of the previous line so it stays unchanged.
    const cutOriginal = cutStart;
    while (cutStart > 0 && (source[cutStart - 1] === ' ' || source[cutStart - 1] === '\t')) {
      cutStart--;
    }
    if (source[cutStart] === ' ' && source[cutOriginal] === ',') {
      // Inline: keep one space before the comma.
      cutStart = cutOriginal;
    }
    return [cutStart, end];
  }
  return [start, end];
}

function nodeSet(ast: babel.Node, parentPath?: babel.NodePath) {
  const set = new Set<babel.Node>();
  babel.traverse(
    ast,
    {
      enter(path) {
        set.add(path.node);
      },
    },
    parentPath?.scope,
    parentPath?.state,
    parentPath,
  );
  return set;
}
