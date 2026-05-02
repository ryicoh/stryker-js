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
      'const o = { baz: "qux" }',
      'const o = { foo: "bar" }',
    );
  });

  it('should yield one mutant per property removed (3 props)', () => {
    expectJSMutation(
      sut,
      'const o = { a: 1, b: 2, c: 3 }',
      'const o = { b: 2, c: 3 }',
      'const o = { a: 1, c: 3 }',
      'const o = { a: 1, b: 2 }',
    );
  });

  it('should mutate computed string keys', () => {
    expectJSMutation(
      sut,
      'const o = { ["foo"]: 1, bar: 2 }',
      'const o = { bar: 2 }',
      'const o = { ["foo"]: 1 }',
    );
  });

  it('should mutate shorthand properties', () => {
    expectJSMutation(
      sut,
      'const o = { a, b }',
      'const o = { b }',
      'const o = { a }',
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
      'function f() {\n    const o = { b: 2 };\n}',
      'function f() {\n    const o = { a: 1 };\n}',
    );
  });

  it('should preserve 8-space indentation surrounding the object literal', () => {
    expectJSMutation(
      sut,
      'function outer() {\n    function inner() {\n        const o = { a: 1, b: 2 };\n    }\n}',
      'function outer() {\n    function inner() {\n        const o = { b: 2 };\n    }\n}',
      'function outer() {\n    function inner() {\n        const o = { a: 1 };\n    }\n}',
    );
  });

  it('should mutate a prisma-like findMany options object without changing outer formatting', () => {
    expectJSMutation(
      sut,
      `
  const users = await prisma.user.findMany({
    where: { active: true },
    include: { memberships: true },
    orderBy: [{ memberships: { sortOrder: "asc" } }, { membershipsId: "asc" }],
  });
  `,
      `
  const users = await prisma.user.findMany({
    include: { memberships: true },
    orderBy: [{ memberships: { sortOrder: "asc" } }, { membershipsId: "asc" }],
  });
  `,
      `
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ memberships: { sortOrder: "asc" } }, { membershipsId: "asc" }],
  });
  `,
      `
  const users = await prisma.user.findMany({
    where: { active: true },
    include: { memberships: true },
  });
  `,
    );
  });
});
