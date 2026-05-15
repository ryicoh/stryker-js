import babel, { type NodePath } from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

const swapMap: Record<string, string> = {
  asc: 'desc',
  desc: 'asc',
};

export const ascDescSwapMutator: NodeMutator = {
  name: 'AscDescSwap',

  *mutate(path) {
    if (path.isStringLiteral() && isValidParent(path)) {
      const swapped = swapMap[path.node.value];
      if (swapped !== undefined) {
        yield types.stringLiteral(swapped);
      }
      return;
    }
    if (
      path.isTemplateLiteral() &&
      path.node.expressions.length === 0 &&
      path.node.quasis.length === 1
    ) {
      const swapped = swapMap[path.node.quasis[0].value.raw];
      if (swapped !== undefined) {
        yield types.templateLiteral(
          [types.templateElement({ raw: swapped })],
          [],
        );
      }
    }
  },
};

function isValidParent(child: NodePath<babel.types.StringLiteral>): boolean {
  const { parent } = child;
  return !(
    types.isImportDeclaration(parent) ||
    types.isExportDeclaration(parent) ||
    types.isImportOrExportDeclaration(parent) ||
    types.isTSExternalModuleReference(parent) ||
    types.isTSLiteralType(parent) ||
    (types.isObjectProperty(parent) && parent.key === child.node) ||
    (types.isClassProperty(parent) && parent.key === child.node) ||
    (types.isCallExpression(parent) &&
      types.isIdentifier(parent.callee, { name: 'require' })) ||
    (types.isCallExpression(parent) && types.isImport(parent.callee))
  );
}
