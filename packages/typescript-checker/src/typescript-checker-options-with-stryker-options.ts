import type { StrykerOptions } from '@ryicoh/api/core';

import type { TypescriptCheckerPluginOptions } from '../src-generated/typescript-checker-options.js';

export interface TypescriptCheckerOptionsWithStrykerOptions
  extends TypescriptCheckerPluginOptions, StrykerOptions {}
