const kexec = require('kexec');
const yargs = require('yargs');

const configureFileDistribution = require('./configure-file-dist');

/**
 * This module exports the main function for the entry script of the
 * docker container run on travis and build with `Dockerfile-test`.
 */

module.exports = async function main(argv) {
  const { command, options } = parseArgs(argv);
  if (command === 'configure-file-dist') {
    await configureFileDistribution(options);
  } else if (command === 'test') {
    kexec('./bin/test');
  } else {
    throw new Error(`Unknown command "${command}"`);
  }
};

const TRAVIS_DESC =
  'Create configured file distribution for all environments from CI parameters.\n' +
  'For each of the three environments production, staging, and preview a file\n' +
  'distribution is created in `./output/files/${env}`.';

const TEST_DESC = 'Run the karma and jest test suite.';

function parseArgs(argv) {
  const args = yargs(argv)
    .strict()
    .usage(
      'Usage: ... configure-file-dist --branch BRANCH --version VERSION\n' + '           test\n'
    )
    .group('help', 'Global options:')
    .help('help')
    .alias('help', 'h')
    .demand(1, 'No command given')

    .command('test', TEST_DESC)
    .command('configure-file-dist', TRAVIS_DESC, function(yargs) {
      return yargs
        .strict()
        .usage(`Usage: ... configure-file-dist [options]\n\n${TRAVIS_DESC}`)
        .options({
          branch: {
            type: 'string',
            alias: 'b',
            description: 'Branch name',
            requiresArgs: true,
            required: true
          },
          version: {
            type: 'string',
            alias: 'v',
            description: 'Set the version identifier',
            requiresArg: true,
            required: true
          }
        });
    }).argv;

  return {
    command: args._.shift(),
    options: args
  };
}
