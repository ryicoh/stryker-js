import babel from '@babel/core';

import { deepCloneNode } from '../util/index.js';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const objectPropertyRemovalMutator: NodeMutator = {
  name: 'ObjectPropertyRemoval',

  *mutate(path) {
    if (path.isObjectExpression() && path.node.properties.length >= 2) {
      const { properties } = path.node;
      for (let i = 0; i < properties.length; i++) {
        const remaining = properties
          .filter((_, index) => index !== i)
          .map((property) => deepCloneNode(property));
        yield types.objectExpression(remaining);
      }
    }
  },
};
