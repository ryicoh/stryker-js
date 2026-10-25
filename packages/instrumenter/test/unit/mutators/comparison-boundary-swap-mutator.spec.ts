import { expect } from 'chai';

import { comparisonBoundarySwapMutator as sut } from '../../../src/mutators/comparison-boundary-swap-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "ComparisonBoundarySwap"', () => {
    expect(sut.name).eq('ComparisonBoundarySwap');
  });

  describe('identifier keys', () => {
    it('should mutate "gt" to "gte"', () => {
      expectJSMutation(sut, 'const o = { gt: 5 };', 'const o = { gte: 5 };');
    });

    it('should mutate "gte" to "gt"', () => {
      expectJSMutation(sut, 'const o = { gte: 5 };', 'const o = { gt: 5 };');
    });

    it('should mutate "lt" to "lte"', () => {
      expectJSMutation(sut, 'const o = { lt: 5 };', 'const o = { lte: 5 };');
    });

    it('should mutate "lte" to "lt"', () => {
      expectJSMutation(sut, 'const o = { lte: 5 };', 'const o = { lt: 5 };');
    });
  });

  describe('string literal keys', () => {
    it('should mutate "gt" string key to "gte"', () => {
      expectJSMutation(
        sut,
        'const o = { "gt": 5 };',
        'const o = { "gte": 5 };',
      );
    });
  });

  describe('nested objects', () => {
    it('should yield one mutant per occurrence in nested objects', () => {
      expectJSMutation(
        sut,
        'const w = { where: { id: { gt: 5 } } };',
        'const w = { where: { id: { gte: 5 } } };',
      );
    });
  });

  describe('multiple boundary keys in the same object', () => {
    it('should yield independent mutants for each property', () => {
      expectJSMutation(
        sut,
        'const o = { gt: 5, lt: 10 };',
        'const o = { gte: 5, lt: 10 };',
        'const o = { gt: 5, lte: 10 };',
      );
    });
  });

  describe('negative cases', () => {
    it('should not mutate unrelated property keys', () => {
      expectJSMutation(sut, 'const o = { other: 5 };');
    });

    it('should not mutate computed keys', () => {
      expectJSMutation(sut, 'const o = { ["gt"]: 5 };');
    });

    it('should not mutate shorthand properties', () => {
      expectJSMutation(sut, 'const gt = 5; const o = { gt };');
    });

    it('should not mutate member access', () => {
      expectJSMutation(sut, 'const v = obj.gt;');
    });

    it('should not mutate object methods', () => {
      expectJSMutation(sut, 'const o = { gt() { return 1; } };');
    });
  });
});
