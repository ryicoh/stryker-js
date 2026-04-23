module.exports = {
  $schema:
    '../../node_modules/@ryicoh/core/schema/stryker-schema.json',
  mutate: ['src/*.js'],
  testRunner: 'karma',
  reporters: ['json', 'clear-text', 'html', 'event-recorder'],
  concurrency: 2,
  karma: {
    config: {
      files: ['src/*.js', 'test/*.js'],
      client: {
        clearContext: false,
      },
      plugins: [
        require.resolve('karma-jasmine'),
        require.resolve('karma-chrome-launcher'),
      ],
    },
  },
  plugins: ['@ryicoh/karma-runner'],
  timeoutMS: 120000,
};
