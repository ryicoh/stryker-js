/* eslint-disable no-var */
declare var __stryker__:
  | import('@ryicoh/api/core').InstrumenterContext
  | undefined;
// used during testing, so we can actually run stryker on the @ryicoh/jest-runner package itself
declare var __stryker2__:
  | import('@ryicoh/api/core').InstrumenterContext
  | undefined;

declare var __strykerGlobalNamespace__: '__stryker__' | '__stryker2__';

declare var jasmine: import('./jasmine.js').Jasmine;
