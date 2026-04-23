import { expect } from 'chai';

import { objectPropertyRemovalMutator as sut } from '../../../src/mutators/object-property-removal-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "ObjectPropertyRemoval"', () => {
    expect(sut.name).eq('ObjectPropertyRemoval');
  });

  it('should mutate an object with 2 properties by removing each', () => {
    expectJSMutation(sut, '({ a: 1, b: 2 })', '({\n  a: 1\n})', '({\n  b: 2\n})');
  });

  it('should mutate an object with 3 properties by removing each', () => {
    expectJSMutation(
      sut,
      '({ a: 1, b: 2, c: 3 })',
      '({\n  a: 1,\n  b: 2\n})',
      '({\n  a: 1,\n  c: 3\n})',
      '({\n  b: 2,\n  c: 3\n})',
    );
  });

  it('should not mutate an object with a single property', () => {
    expectJSMutation(sut, '({ a: 1 })');
  });

  it('should not mutate an empty object', () => {
    expectJSMutation(sut, '({})');
  });

  it('should handle spread elements', () => {
    expectJSMutation(sut, '({ ...base, id: 1 })', '({\n  ...base\n})', '({\n  id: 1\n})');
  });

  it('should handle computed property keys', () => {
    expectJSMutation(sut, '({ [key]: 1, b: 2 })', '({\n  [key]: 1\n})', '({\n  b: 2\n})');
  });

  it('should handle shorthand properties', () => {
    expectJSMutation(sut, '({ a, b })', '({\n  a\n})', '({\n  b\n})');
  });

  it('should mutate nested object (indentation must be relative, not absolute)', () => {
    expectJSMutation(
      sut,
      'fn({ where: { id: 1, status: "active" } })',
      'fn({ where: {\n  id: 1\n} })',
      'fn({ where: {\n  status: "active"\n} })',
    );
  });
});
