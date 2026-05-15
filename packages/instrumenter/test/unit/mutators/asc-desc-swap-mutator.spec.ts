import { expect } from 'chai';

import { ascDescSwapMutator as sut } from '../../../src/mutators/asc-desc-swap-mutator.js';
import { expectJSMutation } from '../../helpers/expect-mutation.js';

describe(sut.name, () => {
  it('should have name "AscDescSwap"', () => {
    expect(sut.name).eq('AscDescSwap');
  });

  describe('string literals', () => {
    it('should mutate "asc" into "desc"', () => {
      expectJSMutation(sut, 'const d = "asc";', 'const d = "desc";');
    });

    it('should mutate "desc" into "asc"', () => {
      expectJSMutation(sut, 'const d = "desc";', 'const d = "asc";');
    });

    it('should mutate uppercase "ASC" into "DESC"', () => {
      expectJSMutation(sut, 'const d = "ASC";', 'const d = "DESC";');
    });

    it('should mutate uppercase "DESC" into "ASC"', () => {
      expectJSMutation(sut, 'const d = "DESC";', 'const d = "ASC";');
    });

    it('should mutate capitalized "Asc" into "Desc"', () => {
      expectJSMutation(sut, 'const d = "Asc";', 'const d = "Desc";');
    });

    it('should mutate capitalized "Desc" into "Asc"', () => {
      expectJSMutation(sut, 'const d = "Desc";', 'const d = "Asc";');
    });

    it('should mutate single-quoted strings', () => {
      expectJSMutation(sut, "const d = 'asc';", 'const d = "desc";');
    });

    it('should mutate in function call arguments', () => {
      expectJSMutation(
        sut,
        'orderBy("name", "asc");',
        'orderBy("name", "desc");',
      );
    });

    it('should mutate in object property values', () => {
      expectJSMutation(
        sut,
        'const q = { order: "asc" };',
        'const q = { order: "desc" };',
      );
    });

    it('should not mutate unrelated strings', () => {
      expectJSMutation(sut, 'const d = "hello";');
      expectJSMutation(sut, 'const d = "ascending";');
      expectJSMutation(sut, 'const d = "description";');
    });
  });

  describe('template literals', () => {
    it('should mutate `asc` into `desc`', () => {
      expectJSMutation(sut, 'const d = `asc`;', 'const d = `desc`;');
    });

    it('should mutate `desc` into `asc`', () => {
      expectJSMutation(sut, 'const d = `desc`;', 'const d = `asc`;');
    });

    it('should not mutate template literals with expressions', () => {
      expectJSMutation(sut, 'const d = `asc${x}`;');
      expectJSMutation(sut, 'const d = `${x}desc`;');
    });

    it('should not mutate template literals with unrelated content', () => {
      expectJSMutation(sut, 'const d = `ascending`;');
    });
  });

  describe('excluded contexts', () => {
    it('should not mutate import paths', () => {
      expectJSMutation(sut, 'import x from "asc";');
      expectJSMutation(sut, 'import x from "desc";');
    });

    it('should not mutate require call paths', () => {
      expectJSMutation(sut, 'require("asc");');
    });

    it('should not mutate dynamic import paths', () => {
      expectJSMutation(sut, 'import("desc");');
    });

    it('should not mutate object property keys', () => {
      expectJSMutation(sut, 'const o = { "asc": 1, "desc": 2 };');
    });

    it('should not mutate type literal types', () => {
      expectJSMutation(sut, 'const d: "asc" = "asc";', 'const d: "asc" = "desc";');
    });
  });
});
