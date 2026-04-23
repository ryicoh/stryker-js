import { PluginKind, declareClassPlugin } from '@ryicoh/api/plugin';

export class MutationRunPlanReporter {
  /**
   * @type {import('@ryicoh/api/report').MutationTestingPlanReadyEvent}
   */
  event;
  /**
   * @type { MutationRunPlanReporter }
   */
  static instance;

  constructor() {
    MutationRunPlanReporter.instance = this;
  }

  /**
   * @param {import('@ryicoh/api/report').MutationTestingPlanReadyEvent} event
   * @returns {void}
   */
  onMutationTestingPlanReady(event) {
    this.event = event;
  }
}

export const strykerPlugins = [
  declareClassPlugin(
    PluginKind.Reporter,
    'mutation-run-plan',
    MutationRunPlanReporter,
  ),
];
