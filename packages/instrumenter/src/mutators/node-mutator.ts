import type { types, NodePath } from '@babel/core';

export interface NodeMutator {
  mutate(
    path: NodePath,
    context?: { sourceFileName: string },
  ): Iterable<types.Node>;
  readonly name: string;
}
