const gulp = require('gulp');
const runSequence = require('run-sequence');
const { buildStylus } = require('./helpers');
const yargs = require('yargs');
const B = require('bluebird');
const childProcess = require('child_process');
const _ = require('lodash');

const argv = yargs.boolean('verbose').alias('verbose', 'v').argv;

gulp.task('styleguide', function(done) {
  runSequence('styleguide/stylesheets', 'styleguide/copy-assets', 'styleguide/generate', done);
});

gulp.task('styleguide/generate', function() {
  return spawnOnlyStderr('kss-node', [
    '--template',
    'styleguide',
    '--helpers',
    'styleguide/helpers',
    '--source',
    'src/stylesheets',
    '--destination',
    'public/styleguide',
    '--placeholder',
    ''
  ]);
});

gulp.task('styleguide/copy-assets', function() {
  return gulp.src('public/app/**/*.{js,css}').pipe(gulp.dest('./public/styleguide/app'));
});

gulp.task('styleguide/stylesheets', function() {
  return buildStylus('styleguide/custom.styl', './public/styleguide');
});

function spawnOnlyStderr(cmd, args, opts) {
  const stdout = argv.verbose ? process.stdout : 'ignore';
  opts = _.defaults(opts || {}, {
    stdio: ['ignore', stdout, process.stderr]
  });
  return spawn(cmd, args, opts);
}

function spawn(cmd, args, opts) {
  return new B(function(resolve, reject) {
    childProcess
      .spawn(cmd, args, opts)
      .on('exit', function(code, signal) {
        if (code === 0) {
          resolve();
        } else if (signal) {
          reject(new Error('Process killed by signal ' + signal));
        } else {
          reject(new Error('Process exited with status code ' + code));
        }
      })
      .on('error', function(err) {
        reject(err);
      });
  });
}
