import type { types, NodePath } from '@babel/core';

export interface NodeMutator {
  mutate(
    path: NodePath,
    context?: {
      sourceFileName: string;
      isNullable?: (node: types.Node) => boolean;
    },
  ): Iterable<types.Node>;
  readonly name: string;
}
