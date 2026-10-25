import babel from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const objectPropertyRemovalMutator: NodeMutator = {
  name: 'ObjectPropertyRemoval',

  *mutate(path) {
    if (
      !path.isObjectProperty() &&
      !path.isObjectMethod() &&
      !path.isSpreadElement()
    ) {
      return;
    }
    const parent = path.parentPath;
    if (!parent || !parent.isObjectExpression()) {
      return;
    }
    if (parent.node.properties.length < 2) {
      return;
    }
    // A `Noop` node serves as the "remove this property" marker. The Mutant
    // class detects it and calls `path.remove()` instead of `path.replaceWith()`,
    // and `@babel/generator` prints it as an empty string.
    const noop = types.noop();
    // Extend the reported location past the property's trailing comma + line
    // break (or to swallow the leading comma when this is the last property)
    // so the mutation report's diff doesn't leave a dangling `,` on its own
    // line. The Mutant class prefers `replacement.loc` over `original.loc`
    // when set.
    const source: string | undefined = (
      path.hub as { file?: { code?: string } } | undefined
    )?.file?.code;
    const startOffset = path.node.start;
    const endOffset = path.node.end;
    const startLoc = path.node.loc?.start;
    if (
      source != null &&
      startOffset != null &&
      endOffset != null &&
      startLoc
    ) {
      const [extStart, extEnd] = expandRemovalRange(
        source,
        startOffset,
        endOffset,
      );
      noop.start = extStart;
      noop.end = extEnd;
      noop.loc = {
        start: offsetToPosition(source, extStart),
        end: offsetToPosition(source, extEnd),
      } as babel.types.SourceLocation;
    }
    yield noop;
  },
};

// Expand [start, end) so the cut consumes the property's trailing comma plus
// its line ending (or its leading comma when removing the last property),
// matching the source manipulation that happens via babel's `path.remove()`.
function expandRemovalRange(
  source: string,
  start: number,
  end: number,
): [number, number] {
  let cutEnd = end;
  let trailingComma = false;
  if (source[cutEnd] === ',') {
    cutEnd++;
    trailingComma = true;
  }
  let i = cutEnd;
  while (source[i] === ' ' || source[i] === '\t') i++;
  let sawNewline = false;
  if (source[i] === '\r') {
    i++;
    sawNewline = true;
  }
  if (source[i] === '\n') {
    i++;
    sawNewline = true;
  }
  if (sawNewline) {
    cutEnd = i;
    let cutStart = start;
    while (
      cutStart > 0 &&
      (source[cutStart - 1] === ' ' || source[cutStart - 1] === '\t')
    ) {
      cutStart--;
    }
    return [cutStart, cutEnd];
  }
  if (trailingComma) {
    if (source[cutEnd] === ' ') cutEnd++;
    return [start, cutEnd];
  }
  // No trailing comma — last property. Swallow the preceding comma + space.
  let cutStart = start;
  while (cutStart > 0 && /\s/.test(source[cutStart - 1])) cutStart--;
  if (cutStart > 0 && source[cutStart - 1] === ',') {
    cutStart--;
  }
  return [cutStart, end];
}

function offsetToPosition(
  source: string,
  offset: number,
): { line: number; column: number; index: number } {
  let line = 1;
  let column = 0;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      column = 0;
    } else {
      column++;
    }
  }
  return { line, column, index: offset };
}
