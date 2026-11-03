import babel, { type NodePath } from '@babel/core';

import { deepCloneNode } from '../util/index.js';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const nullValueMutator: NodeMutator = {
  name: 'NullValue',

  *mutate(
    path: NodePath,
    context?: {
      sourceFileName: string;
      isNullable?: (node: babel.types.Node) => boolean;
    },
  ): Iterable<babel.types.Node> {
    if (!context?.sourceFileName.match(/\.[cm]?tsx?$/)) {
      return;
    }
    const parent = path.parentPath;
    if (
      path.listKey === 'arguments' &&
      (parent?.isCallExpression() ||
        parent?.isOptionalCallExpression() ||
        parent?.isNewExpression()) &&
      path.isExpression() &&
      !path.isNullLiteral() &&
      context.isNullable?.(path.node)
    ) {
      yield types.nullLiteral();
    }

    if (path.isObjectProperty() && parent?.isObjectExpression()) {
      if (
        types.isNullLiteral(path.node.value) ||
        !context.isNullable?.(path.node.value)
      ) {
        return;
      }
      const replacement = types.objectProperty(
        deepCloneNode(path.node.key),
        types.nullLiteral(),
        path.node.computed,
        false,
      );
      yield replacement;
    }
  },
};
