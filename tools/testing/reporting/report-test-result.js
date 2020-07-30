#!/usr/bin/env node

const Analytics = require('analytics-node');
const Parser = require('junitxml-to-javascript');
const { execSync } = require('child_process');
const glob = require('glob');
const { promisify } = require('util');

const argv = require('yargs')
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'source path pattern',
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'name the tests',
  })
  .help().argv;

const gitCmd = (cmd) => execSync(cmd).toString().trim();

const REPORTS_PATH_PATTERN = argv.path;
const SEGMENT_KEY = process.env.SEGMENT_TEST_RESULT_KEY;
const GIT_BRANCH = process.env.CIRCLE_BRANCH || gitCmd('git rev-parse --abbrev-ref HEAD');
const GIT_REV = process.env.CIRCLE_SHA1 || gitCmd('git rev-parse HEAD');
const GIT_REPO =
  process.env.CIRCLE_PROJECT_REPONAME || gitCmd('basename $(git remote get-url origin) .git');

if (!REPORTS_PATH_PATTERN) {
  console.error('please provide a junit.xml path argument');
  process.exit(1);
}

if (!SEGMENT_KEY) {
  console.error('please provide a SEGMENT_TEST_RESULT_KEY env var');
  process.exit(1);
}

let name;

const parser = new Parser({
  modifier: (xmlObject) => {
    const x = {};
    name = xmlObject.testsuites ? xmlObject.testsuites.name : 'unknown';
    x.testsuites = xmlObject.testsuites;
    return x;
  },
});
const userId = 'segment-test-reporter';
const analytics = new Analytics(SEGMENT_KEY);

const generateResult = (testsuits) =>
  testsuits.reduce(
    (result, testsuite) => {
      result.tests += testsuite.tests;
      result.failed += testsuite.errors;
      result.skipped += testsuite.skipped;
      result.duration += testsuite.durationSec;
      testsuite.testCases.forEach((test) => {
        if (test.result === 'failed') {
          result.failed_tests.push({
            test_suite: testsuite.name,
            test_case: test.name,
          });
        }
      });
      return result;
    },
    {
      tests: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failed_tests: [],
    }
  );

const consumeJunitReport = async (reportPath) => {
  const json = await parser.parseXMLFile(reportPath);
  const generated = generateResult(json.testsuites);
  const result = {
    name: argv.name || name,
    source: reportPath,
    repo: GIT_REPO,
    branch: GIT_BRANCH,
    revision: GIT_REV,
    ...generated,
  };
  console.log(`pushing report for ${reportPath}`);
  await new Promise((resolve) => {
    analytics.track(
      {
        userId,
        event: 'test_result',
        properties: result,
      },
      resolve
    );
  });
};

const run = async () => {
  const reportPaths = await promisify(glob)(REPORTS_PATH_PATTERN);
  console.log(`found ${reportPaths.length} report(s) matching ${REPORTS_PATH_PATTERN}`);
  await Promise.all(reportPaths.map(consumeJunitReport));
  await new Promise((resolve) => {
    analytics.flush(resolve);
  });
};

run();
