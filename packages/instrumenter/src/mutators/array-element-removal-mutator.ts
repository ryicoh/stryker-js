import babel, { type NodePath } from '@babel/core';

import { deepCloneNode } from '../util/index.js';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const arrayElementRemovalMutator: NodeMutator = {
  name: 'ArrayElementRemoval',

  *mutate(path: NodePath): Iterable<babel.types.Node> {
    if (!path.isArrayExpression()) {
      return;
    }
    const { elements } = path.node;
    // A single element is already covered by the ArrayDeclaration mutator,
    // which empties the whole array.
    if (elements.length < 2) {
      return;
    }
    for (let index = 0; index < elements.length; index++) {
      // Holes in a sparse array (`[1, , 3]`) are not elements to remove.
      if (elements[index] === null) {
        continue;
      }
      yield types.arrayExpression(
        elements
          .filter((_, otherIndex) => otherIndex !== index)
          .map((element) => (element === null ? null : deepCloneNode(element))),
      );
    }
  },
};
