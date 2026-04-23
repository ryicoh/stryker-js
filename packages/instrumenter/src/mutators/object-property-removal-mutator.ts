import babel, { type NodePath } from '@babel/core';

import { NodeMutator } from './node-mutator.js';

const { types } = babel;

export const objectPropertyRemovalMutator: NodeMutator = {
  name: 'ObjectPropertyRemoval',

  *mutate(path: NodePath): Iterable<babel.types.Node> {
    // >= 2: single-property removal is already covered by objectLiteralMutator (→ {})
    if (path.isObjectExpression() && path.node.properties.length >= 2) {
      for (let i = 0; i < path.node.properties.length; i++) {
        const mutatedProperties = path.node.properties
          .filter((_, index) => index !== i)
          .map((prop) => types.cloneNode(prop, /* deep */ true, /* withoutLocations */ true));
        yield types.objectExpression(mutatedProperties);
      }
    }
  },
};
