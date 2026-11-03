import { expect } from 'chai';

import { nullValueMutator as sut } from '../../../src/mutators/null-value-mutator.js';
import {
  expectJSMutation,
  expectTSMutation,
} from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('has the name NullValue', () => {
    expect(sut.name).eq('NullValue');
  });

  it('replaces one call argument at a time', () => {
    expectTSMutation(sut, 'f(a, b)', 'f(null, b)', 'f(a, null)');
  });

  it('replaces arguments of optional calls and constructors', () => {
    expectTSMutation(sut, 'f?.(a)', 'f?.(null)');
    expectTSMutation(sut, 'new F(a)', 'new F(null)');
  });

  it('replaces one object property value at a time', () => {
    expectTSMutation(
      sut,
      'const x = { a: first, b: second }',
      'const x = { a: null, b: second }',
      'const x = { a: first, b: null }',
    );
  });

  it('handles shorthand and computed properties', () => {
    expectTSMutation(
      sut,
      'const x = { a, [key]: value }',
      'const x = { a: null, [key]: value }',
      'const x = { a, [key]: null }',
    );
  });

  it('does not replace existing nulls or spread arguments', () => {
    expectTSMutation(sut, 'f(null, ...args)');
    expectTSMutation(sut, 'const x = { a: null, ...other }');
  });

  it('does not replace declaration initializers or array elements', () => {
    expectTSMutation(sut, 'const x = value; const y = [value]');
  });

  it('does not mutate JavaScript files without nullable types', () => {
    expectJSMutation(sut, 'f(a); const x = { a }');
  });
});
