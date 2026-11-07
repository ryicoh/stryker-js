import babel, { type NodePath } from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

const swapMap = new Map<string, readonly string[]>([
  ['contains', ['startsWith', 'endsWith']],
  ['startsWith', ['contains']],
  ['endsWith', ['contains']],
]);

export const stringFilterSwapMutator: NodeMutator = {
  name: 'StringFilterSwap',

  *mutate(path) {
    if (path.isIdentifier()) {
      if (!isObjectPropertyKey(path)) return;
      for (const swapped of swapMap.get(path.node.name) ?? []) {
        yield types.identifier(swapped);
      }
    } else if (path.isStringLiteral()) {
      if (!isObjectPropertyKey(path)) return;
      for (const swapped of swapMap.get(path.node.value) ?? []) {
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
