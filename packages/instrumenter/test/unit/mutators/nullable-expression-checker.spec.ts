import path from 'node:path';

import type { types } from '@babel/core';
import { expect } from 'chai';

import { createNullableExpressionChecker } from '../../../src/util/nullable-expression-checker.js';

const fixtureDir = path.resolve(
  import.meta.dirname,
  '../../../../testResources/nullable',
);
const tsconfigFile = path.join(fixtureDir, 'tsconfig.json');
const sourceFileName = path.join(fixtureDir, 'source.ts');

describe('createNullableExpressionChecker', () => {
  it('recognizes nullable call arguments and object values', () => {
    const code = `
      type Input = { value: number | null; required: number };
      declare function f(required: number, optional: number | null): void;
      declare const nonNullArg: number;
      declare const nullableArg: number | null;
      f(nonNullArg, nullableArg);
      const object: Input = { value: nullableArg, required: nonNullArg };
    `;
    const isNullable = createNullableExpressionChecker(
      sourceFileName,
      code,
      tsconfigFile,
    );

    expect(isNullable(nodeAt(code, 'nonNullArg', 'f(nonNullArg'))).eq(false);
    expect(isNullable(nodeAt(code, 'nullableArg', 'f(nonNullArg'))).eq(true);
    expect(isNullable(nodeAt(code, 'nullableArg', 'value: nullableArg'))).eq(
      true,
    );
    expect(isNullable(nodeAt(code, 'nonNullArg', 'required: nonNullArg'))).eq(
      false,
    );
  });

  it('does not inspect JavaScript or TypeScript without a tsconfig', () => {
    const code = 'f(value)';
    const node = nodeAt(code, 'value');
    expect(
      createNullableExpressionChecker('source.js', code, tsconfigFile)(node),
    ).eq(false);
    expect(createNullableExpressionChecker('source.ts', code)(node)).eq(false);
  });
});

function nodeAt(code: string, text: string, after = ''): types.Node {
  const start = code.indexOf(text, after ? code.indexOf(after) : 0);
  return { start, end: start + text.length } as types.Node;
}
