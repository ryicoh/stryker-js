import { schema } from '@ryicoh/api/core';

export interface MutationScoreOnlyReport {
  mutationScore: number;
}
export type Report = MutationScoreOnlyReport | schema.MutationTestResult;
