const yargs = require('yargs');

const configureFileDistribution = require('./configure-file-dist');
const uploadSourcemapsToBugsnag = require('./upload-sourcemaps-to-bugsnag');

/**
 * This module exports the main function for the entry script of the
 * docker container run on travis and build with `Dockerfile-test`.
 */

module.exports = async function main(argv) {
  const { command, options } = parseArgs(argv);
  if (command === 'configure-file-dist') {
    await configureFileDistribution(options);
  } else if (command === 'upload-sourcemaps-to-bugsnag') {
    await uploadSourcemapsToBugsnag(options);
  } else {
    throw new Error(`Unknown command "${command}"`);
  }
};

const TRAVIS_DESC =
  'Create configured file distribution for all environments from CI parameters.\n' +
  'For each of the three environments production, staging, and preview a file\n' +
  'distribution is created in `./output/files/${env}`.';

const TEST_DESC = 'Run the jest test suite.';

const SOURCEMAPS_DESC = 'Upload sourcemaps to Bugsnag. The version must be provided.';

function parseArgs(argv) {
  const args = yargs(argv)
    .strict()
    .usage(
      `
Usage: ... configure-file-dist --branch BRANCH --version VERSION
           test
           upload-sourcemaps-to-bugsnag --version VERSION
`
    )
    .group('help', 'Global options:')
    .help('help')
    .alias('help', 'h')
    .demand(1, 'No command given')

    .command('test', TEST_DESC)
    .command('configure-file-dist', TRAVIS_DESC, function (yargs) {
      return yargs
        .strict()
        .usage(`Usage: ... configure-file-dist [options]\n\n${TRAVIS_DESC}`)
        .options({
          branchName: {
            type: 'string',
            alias: 'b',
            description: 'Branch name',
            requiresArgs: true,
            required: true,
          },
          gitSha: {
            type: 'string',
            alias: 'g',
            description: 'Git commit SHA hash',
            requiresArg: true,
            required: true,
          },
        });
    })
    .command('upload-sourcemaps-to-bugsnag', SOURCEMAPS_DESC, (yargs) => {
      return yargs
        .strict()
        .usage(`Usage: ... upload-sourcemaps-to-bugsnag [options]\n\n${SOURCEMAPS_DESC}`)
        .options({
          gitSha: {
            type: 'string',
            alias: 'g',
            description: 'Git commit SHA hash',
            requiresArg: true,
            required: true,
          },
        });
    }).argv;

  return {
    command: args._.shift(),
    options: args,
  };
}
