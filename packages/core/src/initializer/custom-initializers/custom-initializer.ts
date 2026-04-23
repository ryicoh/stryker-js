import { PartialStrykerOptions } from '@ryicoh/api/core';
import { Immutable } from '@ryicoh/util';

export interface CustomInitializer {
  readonly name: string;
  createConfig(): Promise<CustomInitializerConfiguration>;
}

export interface CustomInitializerConfiguration {
  config: Immutable<PartialStrykerOptions>;
  guideUrl: string;
  dependencies: string[];
  additionalConfigFiles?: Record<string, string>;
}
