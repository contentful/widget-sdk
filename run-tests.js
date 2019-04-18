/* eslint-disable no-console */

/**
 * @description this file is responsible for running all tests
 * it runs tests both in watch mode and in a single run.
 * It is used inside `npm test`, so you can pass arguments there:
 * https://docs.npmjs.com/cli/run-script
 * Available options:
 *
 * `npm test` – watch mode. it will automatically run a webpack in
 * the background, and will bundle the first build before running
 * `npm run test:once` – run tests only once, with dots reporter. Helpful if
 * you want to run the full suite just once
 *
 * Production run is determined by NODE_ENV
 */

const { once } = require('lodash');
const { watch } = require('./tools/webpack-tasks');
const {
  Server,
  config: { parseConfig }
} = require('karma');
const { filesNeededToRunTests } = require('./karma.conf');
const { resolve } = require('path');
const { argv } = require('yargs');

const singleRun = argv.once;
const ci = process.env.CI === 'true';

const config = parseConfig(resolve('./karma.conf.js'));

if (singleRun) {
  config.set({
    singleRun: true
  });

  if (ci) {
    const specs = process.argv.slice(3); // 0 -> node, 1 -> run-tests.js, 2 -> --once

    config.set({
      reporters: ['dots', 'junit'],
      junitReporter: {
        outputDir: process.env.JUNIT_REPORT_PATH,
        outputFile: process.env.JUNIT_REPORT_NAME,
        useBrowserName: false
      },
      files: [
        'build/app/**/test-bundle*.js',
        'build/app/**/chunk_*.js',
        'build/app/**/*.css'
      ].concat(filesNeededToRunTests, specs), // we get specs to run from circleci as we parallelize karma runs
      browsers: ['ChromeHeadlessNoSandbox'],
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox']
        }
      }
    });
  } else {
    // we don't show a detailed report for single runs
    config.set({
      files: config.files.concat(['test/unit/**/*.js', 'test/integration/**/*.js'])
    });
  }
  runTests();
} else {
  // we need to do the following:
  // 1. build our initial bundle using webpack
  // 2. watch for future changes in JS files (to build them again)
  // 3. run karma in watching mode
  watch(null, {
    // this callback will be triggered after each build,
    // but we need to run karma only once
    onSuccess: once(runTests)
  });
}

function runTests() {
  const server = new Server(config, exitCode => {
    console.log(`Karma has exited with ${exitCode}`);
    process.exit(exitCode);
  });
  server.start();
}
