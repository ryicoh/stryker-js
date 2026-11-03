import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import ts from 'typescript';
import sinon from 'sinon';
import { expect } from 'chai';
import { factory, testInjector } from '@stryker-mutator/test-helpers';
import { CheckStatus } from '@stryker-mutator/api/check';
import { API } from '@typescript/native/sync';

import { createTypescriptChecker } from '../../src/index.js';
import { TypescriptCheckerOptionsWithStrykerOptions } from '../../src/typescript-checker-options-with-stryker-options.js';
import { TypescriptCompiler } from '../../src/typescript-compiler.js';

const resource = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../testResources/native-project',
);

describe('Native TypeScript checker backend', () => {
  let checkers: ReturnType<typeof createTypescriptChecker>[];

  beforeEach(() => {
    checkers = [];
  });

  afterEach(() => {
    for (const checker of checkers) checker.dispose();
  });

  function createChecker() {
    const checker = testInjector.injector.injectFunction(
      createTypescriptChecker,
    );
    checkers.push(checker);
    return checker;
  }

  it('should check snapshot updates without starting the legacy watch compiler', async () => {
    sinon
      .stub(TypescriptCompiler.prototype, 'init')
      .throws(new Error('Legacy watch compiler was started'));
    const options =
      testInjector.options as TypescriptCheckerOptionsWithStrykerOptions;
    options.tsconfigFile = path.join(resource, 'tsconfig.json');
    options.typescriptChecker = {
      backend: 'native',
      prioritizePerformanceOverAccuracy: true,
    };
    const sut = createChecker();
    await sut.init();
    const invalid = createMutant('producer.ts', '42', '"invalid"', 'invalid');
    const valid = createMutant('producer.ts', '42', '43', 'valid');

    const first = await sut.check([invalid]);
    const second = await sut.check([valid]);
    const third = await sut.check([invalid]);

    expect(first.invalid.status).eq(CheckStatus.CompileError);
    expect(first).deep.eq(third);
    expect(second).deep.eq({ valid: { status: CheckStatus.Passed } });
    sut.dispose();
    await expect(sut.check([valid])).rejectedWith(
      'Native TypeScript checker is not initialized',
    );
  });

  for (const [config, message] of [
    ['tsconfig.error.json', 'Cannot find type definition file'],
    [
      'tsconfig.malformed.json',
      'Typescript error(s) found in dry run compilation',
    ],
  ]) {
    it(`should reject ${config} and close the native compiler`, async () => {
      const close = sinon.spy(API.prototype, 'close', ['get']);
      const options =
        testInjector.options as TypescriptCheckerOptionsWithStrykerOptions;
      options.tsconfigFile = path.join(resource, config);
      options.typescriptChecker = {
        backend: 'native',
        prioritizePerformanceOverAccuracy: true,
      };
      const sut = createChecker();

      await expect(sut.init()).rejectedWith(message);
      sut.dispose();
      expect(close.get).calledOnce;
    });
  }

  for (const config of ['tsconfig.json', 'tsconfig.references.json']) {
    it(`should preserve legacy grouping and statuses with ${config}`, async () => {
      const options =
        testInjector.options as TypescriptCheckerOptionsWithStrykerOptions;
      options.tsconfigFile = path.join(resource, config);
      options.typescriptChecker = {
        backend: 'typescript',
        prioritizePerformanceOverAccuracy: true,
      };
      const legacy = createChecker();
      await legacy.init();
      options.typescriptChecker = {
        backend: 'native',
        prioritizePerformanceOverAccuracy: true,
      };
      const native = createChecker();
      await native.init();
      const producer = createMutant(
        'producer.ts',
        '42',
        '"invalid"',
        'producer',
      );
      const consumer = createMutant(
        'consumer.ts',
        'number',
        'string',
        'consumer',
      );
      const independent = createMutant(
        'independent.ts',
        'true',
        'false',
        'independent',
      );

      expect(await native.group([producer, consumer, independent])).deep.eq(
        await legacy.group([producer, consumer, independent]),
      );
      expect(await native.check([producer])).deep.eq(
        await legacy.check([producer]),
      );
      expect(await native.check([consumer])).deep.eq(
        await legacy.check([consumer]),
      );
      const grouped = await native.check([producer, independent]);
      expect(grouped).deep.eq(await legacy.check([producer, independent]));
      expect(grouped.producer.status).eq(CheckStatus.CompileError);
      expect(grouped.independent.status).eq(CheckStatus.Passed);
      const invalidIndependent = {
        ...independent,
        replacement: '"invalid"',
      };
      const invalidGroup = await native.check([producer, invalidIndependent]);
      expect(invalidGroup).deep.eq(
        await legacy.check([producer, invalidIndependent]),
      );
      expect(invalidGroup.independent.status).eq(CheckStatus.CompileError);
      expect(fs.existsSync(path.join(resource, 'dist'))).false;
    });
  }
});

function createMutant(
  file: string,
  original: string,
  replacement: string,
  id: string,
) {
  const fileName = path.join(resource, file);
  const content = fs.readFileSync(fileName, 'utf8');
  const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest);
  const start = source.getLineAndCharacterOfPosition(content.indexOf(original));
  const end = source.getLineAndCharacterOfPosition(
    content.indexOf(original) + original.length,
  );
  return factory.mutant({
    id,
    fileName,
    replacement,
    location: {
      start: { line: start.line, column: start.character },
      end: { line: end.line, column: end.character },
    },
  });
}
