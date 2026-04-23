// @ts-check
import {
  declareClassPlugin,
  PluginKind,
  tokens,
  commonTokens,
} from '@ryicoh/api/plugin';
import { DryRunStatus } from '@ryicoh/api/test-runner';

export const strykerPlugins = [
  declareClassPlugin(
    PluginKind.TestRunner,
    'custom',
    class CustomTestRunner {
      static inject = tokens(commonTokens.logger);

      /**
       *
       * @param {import('@ryicoh/api/logging').Logger} logger
       */
      constructor(logger) {
        this.logger = logger;
      }

      /**
       * @returns {import('@ryicoh/api/test-runner').TestRunnerCapabilities}
       */
      capabilities() {
        return { reloadEnvironment: true };
      }
      /**
       * @param {import('@ryicoh/api/test-runner').DryRunOptions} options
       * @returns {Promise<import('@ryicoh/api/test-runner').DryRunResult>}
       */
      dryRun(options) {
        if (this.logger.isTraceEnabled()) {
          this.logger.trace('trace %s', JSON.stringify(options));
        }
        this.logger.debug('test debug');
        this.logger.info('test info');
        this.logger.warn('test warn');
        this.logger.error('test error');
        return Promise.resolve({ status: DryRunStatus.Complete, tests: [] });
      }

      /**
       * @returns {Promise<import('@ryicoh/api/test-runner').MutantRunResult>}
       */
      mutantRun() {
        throw new Error('Not implemented');
      }
    },
  ),
];
