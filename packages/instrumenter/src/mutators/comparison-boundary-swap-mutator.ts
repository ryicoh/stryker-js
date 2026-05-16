import babel, { type NodePath } from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

const swapMap: Record<string, string> = {
  gt: 'gte',
  gte: 'gt',
  lt: 'lte',
  lte: 'lt',
};

export const comparisonBoundarySwapMutator: NodeMutator = {
  name: 'ComparisonBoundarySwap',

  *mutate(path) {
    if (path.isIdentifier()) {
      if (!isObjectPropertyKey(path)) return;
      const swapped = swapMap[path.node.name];
      if (swapped !== undefined) {
        yield types.identifier(swapped);
      }
    } else if (path.isStringLiteral()) {
      if (!isObjectPropertyKey(path)) return;
      const swapped = swapMap[path.node.value];
      if (swapped !== undefined) {
        yield types.stringLiteral(swapped);
      }
    }
  },
};

function isObjectPropertyKey(
  path: NodePath<babel.types.Identifier | babel.types.StringLiteral>,
): boolean {
  const parent = path.parent;
  if (!types.isObjectProperty(parent)) return false;
  if (parent.key !== path.node) return false;
  if (parent.computed) return false;
  if (parent.shorthand) return false;
  return true;
}
