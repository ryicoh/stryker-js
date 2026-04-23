const { mixinJestEnvironment } = require('@ryicoh/jest-runner');
const { TestEnvironment } = require('jest-environment-node');

module.exports = mixinJestEnvironment(TestEnvironment);
