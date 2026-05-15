import { expect } from 'chai';

import { ascDescSwapMutator as sut } from '../../../src/mutators/asc-desc-swap-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "AscDescSwap"', () => {
    expect(sut.name).eq('AscDescSwap');
  });

  describe('mutating "asc" / "desc"', () => {
    it('should mutate "asc" to "desc"', () => {
      expectJSMutation(sut, 'const o = "asc";', 'const o = "desc";');
    });

    it('should mutate "desc" to "asc"', () => {
      expectJSMutation(sut, 'const o = "desc";', 'const o = "asc";');
    });
  });

  describe('imports/exports', () => {
    it('should not mutate import statements with "asc"', () => {
      expectJSMutation(sut, 'import x from "asc";');
    });

    it('should not mutate export statements with "desc"', () => {
      expectJSMutation(sut, 'export * from "desc";');
    });

    it('should not mutate require() calls with "asc"', () => {
      expectJSMutation(sut, 'require("asc");');
    });

    it('should not mutate dynamic import() calls with "desc"', () => {
      expectJSMutation(sut, 'import("desc");');
    });
  });

  describe('type declarations', () => {
    it('should not mutate "asc" in type literal positions', () => {
      expectJSMutation(
        sut,
        'const a: "asc" = "asc";',
        'const a: "asc" = "desc";',
      );
    });
  });

  describe('object properties', () => {
    it('should not mutate "asc" used as an object property key', () => {
      expectJSMutation(sut, 'const o = { "asc": 1 };');
    });

    it('should still mutate "asc" used as an object property value', () => {
      expectJSMutation(
        sut,
        'const o = { order: "asc" };',
        'const o = { order: "desc" };',
      );
    });
  });

  describe('jsx', () => {
    it('should not mutate "asc" in JSX attribute values', () => {
      expectJSMutation(sut, '<div className="asc" />');
    });
  });

  describe('symbols', () => {
    it('should not mutate "asc" passed to Symbol()', () => {
      expectJSMutation(sut, "const a = Symbol('asc');");
    });
  });

  describe('directive prologues', () => {
    it('should not mutate "asc" used as a directive prologue', () => {
      expectJSMutation(sut, '"asc";');
    });
  });
});
