import { expect } from 'chai';

import { arrayElementRemovalMutator as sut } from '../../../src/mutators/array-element-removal-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "ArrayElementRemoval"', () => {
    expect(sut.name).eq('ArrayElementRemoval');
  });

  it('should yield one mutant per element removed (2 elements)', () => {
    expectJSMutation(sut, 'const a = [1, 2]', 'const a = [2]', 'const a = [1]');
  });

  it('should yield one mutant per element removed (3 elements)', () => {
    expectJSMutation(
      sut,
      'const a = [1, 2, 3]',
      'const a = [2, 3]',
      'const a = [1, 3]',
      'const a = [1, 2]',
    );
  });

  it('should mutate spread elements', () => {
    expectJSMutation(
      sut,
      'const a = [...xs, 1]',
      'const a = [1]',
      'const a = [...xs]',
    );
  });

  it('should mutate object literal elements', () => {
    expectJSMutation(
      sut,
      'const a = [{ id: 1 }, { id: 2 }]',
      'const a = [{\n  id: 2\n}]',
      'const a = [{\n  id: 1\n}]',
    );
  });

  it('should not mutate array literals with a single element (covered by ArrayDeclaration mutator)', () => {
    expectJSMutation(sut, 'const a = [1]');
  });

  it('should not mutate empty array literals', () => {
    expectJSMutation(sut, 'const a = []');
  });

  it('should not mutate array destructuring patterns', () => {
    expectJSMutation(sut, 'const [a, b] = xs');
  });

  it('should not mutate call arguments', () => {
    expectJSMutation(sut, 'f(1, 2)');
  });

  it('should preserve 4-space indentation surrounding the array literal', () => {
    expectJSMutation(
      sut,
      'function f() {\n    const a = [1, 2];\n}',
      'function f() {\n    const a = [2];\n}',
      'function f() {\n    const a = [1];\n}',
    );
  });

  it('should re-print the array literal when removing an element from a multi-line array', () => {
    expectJSMutation(
      sut,
      'const orderBy = [\n  "sortOrder",\n  "name",\n  "id",\n];',
      'const orderBy = ["name", "id"];',
      'const orderBy = ["sortOrder", "id"];',
      'const orderBy = ["sortOrder", "name"];',
    );
  });

  it('should keep the holes of a sparse array', () => {
    expectJSMutation(
      sut,
      'const a = [1, , 3]',
      'const a = [, 3]',
      'const a = [1,,]',
    );
  });
});
