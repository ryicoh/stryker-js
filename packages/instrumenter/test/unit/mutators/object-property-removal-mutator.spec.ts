import { expect } from 'chai';

import { objectPropertyRemovalMutator as sut } from '../../../src/mutators/object-property-removal-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "ObjectPropertyRemoval"', () => {
    expect(sut.name).eq('ObjectPropertyRemoval');
  });

  it('should yield one mutant per property removed (2 props)', () => {
    expectJSMutation(
      sut,
      'const o = { foo: "bar", baz: "qux" }',
      'const o = {\n  baz: "qux"\n}',
      'const o = {\n  foo: "bar"\n}',
    );
  });

  it('should yield one mutant per property removed (3 props)', () => {
    expectJSMutation(
      sut,
      'const o = { a: 1, b: 2, c: 3 }',
      'const o = {\n  b: 2,\n  c: 3\n}',
      'const o = {\n  a: 1,\n  c: 3\n}',
      'const o = {\n  a: 1,\n  b: 2\n}',
    );
  });

  it('should mutate computed string keys', () => {
    expectJSMutation(
      sut,
      'const o = { ["foo"]: 1, bar: 2 }',
      'const o = {\n  bar: 2\n}',
      'const o = {\n  ["foo"]: 1\n}',
    );
  });

  it('should mutate shorthand properties', () => {
    expectJSMutation(
      sut,
      'const o = { a, b }',
      'const o = {\n  b\n}',
      'const o = {\n  a\n}',
    );
  });

  it('should not mutate object literals with a single property (covered by ObjectLiteral mutator)', () => {
    expectJSMutation(sut, 'const o = { foo: "bar" }');
  });

  it('should not mutate empty object literals', () => {
    expectJSMutation(sut, 'const o = {}');
  });

  it('should preserve 4-space indentation surrounding the object literal', () => {
    expectJSMutation(
      sut,
      'function f() {\n    const o = { a: 1, b: 2 };\n}',
      'function f() {\n    const o = {\n  a: 1\n};\n}',
      'function f() {\n    const o = {\n  b: 2\n};\n}',
    );
  });

  it('should preserve 8-space indentation surrounding the object literal', () => {
    expectJSMutation(
      sut,
      'function outer() {\n    function inner() {\n        const o = { a: 1, b: 2 };\n    }\n}',
      'function outer() {\n    function inner() {\n        const o = {\n  a: 1\n};\n    }\n}',
      'function outer() {\n    function inner() {\n        const o = {\n  b: 2\n};\n    }\n}',
    );
  });
});
