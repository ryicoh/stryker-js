export default {
  testRunner: 'cucumber',
  plugins: [import.meta.resolve('@ryicoh/cucumber-runner')],
  concurrency: 1,
  timeoutMS: 20000,
  reporters: ['json', 'html'],
};
