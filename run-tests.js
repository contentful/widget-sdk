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
  if (ci) {
    process.exit(1);
    const specs = process.argv.slice(3); // 0 -> node, 1 -> run-tests.js, 2 -> --once
    config.set({
      reporters: ['dots', 'junit'],
      singleRun: true,
      junitReporter: {
        outputDir: process.env.JUNIT_REPORT_PATH,
        outputFile: process.env.JUNIT_REPORT_NAME,
        useBrowserName: false
      }
    });
    // we need to extend config, because we run it in CI environment
    // in order to make it work, you need to build the application for production
    // $ NODE_ENV=production gulp build-app
    // you can run it locally as well, just execute the command above first
    config.set({
      // We only care about the test bundle, not the main application, plus the chunks (like echarts)
      files: ['build/app/**/test-bundle-*.js', 'build/app/**/chunk_*.js', 'build/app/**/*.css']
        .concat(filesNeededToRunTests)
        .concat(specs),

      // Fix for https://crbug.com/638180: Running as root without --no-sandbox is not supported
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
      reporters: ['dots'],
      singleRun: true
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
