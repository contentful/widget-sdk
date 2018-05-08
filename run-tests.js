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
const { Server, config: { parseConfig } } = require('karma');
const { testFiles } = require('./karma.conf');
const { resolve } = require('path');
const { argv } = require('yargs');

const singleRun = argv.once;
const prod = process.env.NODE_ENV === 'production';

const config = parseConfig(resolve('./karma.conf.js'));

if (singleRun || prod) {
  // we don't show a detailed report for single runs
  config.set({
    reporters: ['dots'],
    singleRun: true
  });
}

if (prod) {
  // we need to extend config, because we run it in CI environment
  // in order to make it work, you need to build the application for production
  // $ NODE_ENV=production gulp build/with-styleguide
  // you can run it locally as well, just execute the command above first
  config.set({
    files: [
      'build/app/**/*.js',
      'build/app/**/*.css'
    ].concat(testFiles),

    // Fix for https://crbug.com/638180: Running as root without --no-sandbox is not supported
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    }
  });
  runTests();
} else if (!singleRun) {
  // we need to do the following:
  // 1. build our initial bundle using webpack
  // 2. watch for future changes in JS files (to build them again)
  // 3. run karma in watching mode
  watch(null, {
    // this callback will be triggered after each build,
    // but we need to run karma only once
    onSuccess: once(runTests)
  });
} else {
  runTests();
}

function runTests () {
  var server = new Server(config, (exitCode) => {
    console.log(`Karma has exited with ${exitCode}`);
    process.exit(exitCode);
  });
  server.start();
}
