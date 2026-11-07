import { expect } from 'chai';

import { nullFilterSwapMutator as sut } from '../../../src/mutators/null-filter-swap-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "NullFilterSwap"', () => {
    expect(sut.name).eq('NullFilterSwap');
  });

  describe('object property values', () => {
    it('should mutate undefined to { not: null }', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: undefined };',
        'const o = { confirmedAt: {\n  not: null\n} };',
      );
    });

    it('should mutate null to { not: null }', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: null };',
        'const o = { confirmedAt: {\n  not: null\n} };',
      );
    });

    it('should mutate { not: null } to null without mutating the inner null', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: { not: null } };',
        'const o = { confirmedAt: null };',
      );
    });

    it('should mutate { "not": null } written with a string literal key', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: { "not": null } };',
        'const o = { confirmedAt: null };',
      );
    });
  });

  describe('branches of the property value', () => {
    it('should mutate both branches of a conditional expression', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: includeConfirmed ? undefined : null };',
        'const o = { confirmedAt: includeConfirmed ? {\n  not: null\n} : null };',
        'const o = { confirmedAt: includeConfirmed ? undefined : {\n  not: null\n} };',
      );
    });

    it('should mutate the operand of a logical expression', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: value ?? null };',
        'const o = { confirmedAt: value ?? {\n  not: null\n} };',
      );
    });

    it('should mutate values wrapped in as and satisfies expressions', () => {
      expectJSMutation(
        sut,
        'const o = { confirmedAt: null as Filter };',
        'const o = { confirmedAt: {\n  not: null\n} as Filter };',
      );
      expectJSMutation(
        sut,
        'const o = { confirmedAt: null satisfies Filter };',
        'const o = { confirmedAt: {\n  not: null\n} satisfies Filter };',
      );
    });
  });

  describe('negative cases', () => {
    it('should not mutate null outside of an object property value', () => {
      expectJSMutation(
        sut,
        'const a = null; f(null); function g() { return undefined; }',
      );
    });

    it('should not mutate the test of a conditional expression', () => {
      expectJSMutation(sut, 'const o = { a: undefined ? 1 : 2 };');
    });

    it('should not mutate null inside a comparison', () => {
      expectJSMutation(sut, 'const o = { a: value === null };');
    });

    it('should not mutate array elements', () => {
      expectJSMutation(sut, 'const o = { a: [null, undefined] };');
    });

    it('should not mutate objects with other properties besides not', () => {
      expectJSMutation(sut, 'const o = { a: { not: null, mode: "x" } };');
    });

    it('should not mutate { not } filters with a non-null value', () => {
      expectJSMutation(sut, 'const o = { a: { not: 1 } };');
    });

    it('should not mutate default values in object patterns', () => {
      expectJSMutation(sut, 'const { a = null } = o;');
    });
  });
});
