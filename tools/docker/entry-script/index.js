const B = require('bluebird');
const kexec = require('kexec');
const yargs = require('yargs');

const serve = require('./serve');
const runTravis = require('./travis');

/**
 * This module exports the main function for the entry script of the
 * docker container run on travis and build with `Dockerfile-test`.
 */


module.exports = B.coroutine(main);

function* main (argv) {
  const {command, options} = parseArgs(argv);
  if (command === 'travis') {
    yield* runTravis(options);
  } else if (command === 'test') {
    kexec('./bin/test');
  } else if (command === 'serve') {
    const close = yield* serve();
    process.on('SIGINT', close);
  } else {
    throw new Error(`Unknown command "${command}"`);
  }
}


const TRAVIS_DESC =
  'Create configured file distribution for all environments from Travis parameters.\n' +
  'For each of the three environments production, staging, and preview a file\n' +
  'distribution is created in `./output/files/${env}`.';

const SERVE_DESC =
  'Serves application files on localhost:3001.\n' +
  'The application uses the development configuration for the joistio.com domain.';

const TEST_DESC =
  'Run the karma test suite.';

function parseArgs (argv) {
  const args = yargs(argv)
    .strict()
    .usage(
      'Usage: ... travis --branch BRANCH --pr PR --version VERSION\n' +
      '           test\n' +
      '           serve\n'
    )
    .group('help', 'Global options:')
    .help('help')
    .alias('help', 'h')
    .demand(1, 'No command given')

    .command('test', TEST_DESC)
    .command('serve', SERVE_DESC)
    .command('travis', TRAVIS_DESC, function (yargs) {
      return yargs
      .strict()
      .usage(`Usage: ... travis [options]\n\n${TRAVIS_DESC}`)
      .options({
        branch: {
          type: 'string',
          alias: 'b',
          description: 'Value of $TRAVIS_BRANCH',
          requiresArgs: true,
          required: true
        },
        pr: {
          type: 'string',
          description: 'Value of $TRAVIS_PULL_REQUEST',
          requiresArg: true,
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
    })
    .argv;

  return {
    command: args._.shift(),
    options: args
  };
}
