import Stryker from '@ryicoh/core';

new Stryker({
  testRunner: 'mocha',
  concurrency: 1,
  plugins: ['@ryicoh/mocha-runner'],
}).runMutationTest().then(() => console.log('done')).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
