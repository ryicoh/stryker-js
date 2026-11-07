import babel, { type NodePath } from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const nullFilterSwapMutator: NodeMutator = {
  name: 'NullFilterSwap',

  *mutate(path) {
    if (!isObjectPropertyValue(path)) return;
    if (path.isNullLiteral() && !isNotFilterValue(path)) {
      yield notNullFilter();
    } else if (
      path.isIdentifier({ name: 'undefined' }) &&
      path.isReferencedIdentifier()
    ) {
      yield notNullFilter();
    } else if (path.isObjectExpression() && isNotNullFilter(path.node)) {
      yield types.nullLiteral();
    }
  },
};

function notNullFilter(): babel.types.ObjectExpression {
  return types.objectExpression([
    types.objectProperty(types.identifier('not'), types.nullLiteral()),
  ]);
}

function isNotNullFilter(node: babel.types.ObjectExpression): boolean {
  if (node.properties.length !== 1) return false;
  const [property] = node.properties;
  return (
    types.isObjectProperty(property) &&
    isNotKey(property) &&
    types.isNullLiteral(property.value)
  );
}

function isNotFilterValue(path: NodePath): boolean {
  const { parent } = path;
  return (
    types.isObjectProperty(parent) &&
    parent.value === path.node &&
    isNotKey(parent)
  );
}

function isNotKey(property: babel.types.ObjectProperty): boolean {
  if (property.computed) return false;
  return (
    types.isIdentifier(property.key, { name: 'not' }) ||
    types.isStringLiteral(property.key, { value: 'not' })
  );
}

function isObjectPropertyValue(path: NodePath): boolean {
  let current: NodePath = path;
  for (;;) {
    const parentPath = current.parentPath;
    if (!parentPath) return false;
    if (parentPath.isObjectProperty()) {
      return (
        parentPath.node.value === current.node &&
        parentPath.parentPath?.isObjectExpression() === true
      );
    }
    if (
      (parentPath.isConditionalExpression() && current.key !== 'test') ||
      parentPath.isLogicalExpression() ||
      parentPath.isParenthesizedExpression() ||
      parentPath.isTSAsExpression() ||
      parentPath.isTSSatisfiesExpression() ||
      parentPath.isTSNonNullExpression()
    ) {
      current = parentPath;
      continue;
    }
    return false;
  }
}
