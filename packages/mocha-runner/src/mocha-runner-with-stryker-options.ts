import { StrykerOptions } from '@ryicoh/api/core';

import { MochaRunnerOptions } from '../src-generated/mocha-runner-options.js';

export interface MochaRunnerWithStrykerOptions
  extends StrykerOptions, MochaRunnerOptions {}
