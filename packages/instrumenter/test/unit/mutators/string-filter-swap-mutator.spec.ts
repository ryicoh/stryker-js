import { expect } from 'chai';

import { stringFilterSwapMutator as sut } from '../../../src/mutators/string-filter-swap-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "StringFilterSwap"', () => {
    expect(sut.name).eq('StringFilterSwap');
  });

  describe('identifier keys', () => {
    it('should mutate "contains" to "startsWith" and "endsWith"', () => {
      expectJSMutation(
        sut,
        'const o = { name: { contains: q } };',
        'const o = { name: { startsWith: q } };',
        'const o = { name: { endsWith: q } };',
      );
    });

    it('should mutate "startsWith" to "contains"', () => {
      expectJSMutation(
        sut,
        'const o = { name: { startsWith: q } };',
        'const o = { name: { contains: q } };',
      );
    });

    it('should mutate "endsWith" to "contains"', () => {
      expectJSMutation(
        sut,
        'const o = { name: { endsWith: q } };',
        'const o = { name: { contains: q } };',
      );
    });

    it('should keep sibling properties such as "mode"', () => {
      expectJSMutation(
        sut,
        'const o = { name: { contains: q, mode: "insensitive" } };',
        'const o = { name: { startsWith: q, mode: "insensitive" } };',
        'const o = { name: { endsWith: q, mode: "insensitive" } };',
      );
    });
  });

  describe('string literal keys', () => {
    it('should mutate "contains" written as a string literal key', () => {
      expectJSMutation(
        sut,
        'const o = { "contains": q };',
        'const o = { "startsWith": q };',
        'const o = { "endsWith": q };',
      );
    });
  });

  describe('negative cases', () => {
    it('should not mutate unrelated property keys', () => {
      expectJSMutation(sut, 'const o = { other: q };');
    });

    it('should not mutate keys inherited from Object.prototype', () => {
      expectJSMutation(sut, 'const o = { constructor: q, toString: q };');
    });

    it('should not mutate computed keys', () => {
      expectJSMutation(sut, 'const o = { ["contains"]: q };');
    });

    it('should not mutate shorthand properties', () => {
      expectJSMutation(sut, 'const contains = q; const o = { contains };');
    });

    it('should not mutate member access', () => {
      expectJSMutation(sut, 'const v = s.startsWith(q);');
    });

    it('should not mutate string values', () => {
      expectJSMutation(sut, 'const o = { mode: "contains" };');
    });

    it('should not mutate object methods', () => {
      expectJSMutation(sut, 'const o = { contains() { return 1; } };');
    });
  });
});
