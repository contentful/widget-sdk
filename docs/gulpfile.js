'use strict';
require('babel/register');

var _ = require('lodash-node');
var gulp = require('gulp');
var log = require('gulp-util').log;
var concat = require('gulp-concat');
var bower = require('bower');
var Dgeni = require('dgeni');
var merge = require('merge-stream');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var sourceMaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var nib = require('nib');
var streamForEach = require('./tasks/utils').forEach;
var rename = require('gulp-rename');


var outputFolder = '../public/docs';

gulp.task('default', ['api','guides', 'app', 'assets' ]);

gulp.task('api', function() {
  var dgeni = new Dgeni([require('./config')]);
  return dgeni.generate();
});


var guidesPipe = require('./tasks/guides');
var guides = ['guides/**/*.md'];
gulp.task('guides', function () {
  var guidesSrc = gulp.src(guides, {base: '.'});

  var readmeSrc = gulp.src('../README.md', {base: '..'})
  .pipe(rename({prefix: 'guides/'}))
  .pipe(streamForEach(function (file) {
    file.attributes = {
      title: 'Readme'
    };
  }));

  return merge(guidesSrc, readmeSrc)
  .pipe(guidesPipe())
  .pipe(gulp.dest(outputFolder));
});


var app = ['app/src/**/*.js'];
var partials = ['app/partials/**/*.html'];

gulp.task('app', ['app/partials', 'app/js']);

gulp.task('app/js', function () {
  var target = 'app.js';
  var folder = path.join(outputFolder, 'js');

  return gulp.src(app)
  .pipe(sourcemaps.init())
  .pipe(concat(target))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(folder));
});

gulp.task('app/partials', function () {
  var folder = path.join(outputFolder, 'partials');
  return gulp.src(partials)
  .pipe(gulp.dest(folder));
});

var assets = ['assets/**/*', 'index.html'];
gulp.task('assets', ['components', 'stylesheets'], function() {
  return gulp.src(assets)
  .pipe(gulp.dest(outputFolder));
});

gulp.task('stylesheets', function () {
  var destFolder = path.join(outputFolder, 'css');
  return gulp.src('stylesheets/main.styl')
    .pipe(sourceMaps.init())
    .pipe(stylus({use: nib()}))
    .pipe(rename('main.css'))
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest(destFolder));
});

gulp.task('components', ['bower-install'], function() {
  var dest = path.join(outputFolder, 'components');
  var bower = copyPackage('bower_components', dest);
  var node_modules = copyPackage('../node_modules', dest);
  return merge(
    bower('angular', '*.js'),
    // TODO use the package from the UI
    bower('angular-ui-router', 'release/angular-ui-router.js'),
    bower('font-source-sans-pro'),
    bower('lunr.js', '*.js'),
    bower('google-code-prettify'),
    bower('jquery', 'dist/*.js'),
    bower('font-awesome', '**/*.+(css|woff|svg)'),
    node_modules('highlight.js', 'styles/**/*.css')
  )
  .pipe(gulp.dest(dest));
});


gulp.task('bower-install', function() {
  var bowerTask = bower.commands.install();
  bowerTask.on('log', function (result) {
    log('bower:', result.id, result.data.endpoint.name);
  });
  bowerTask.on('error', function(error) {
    log(error);
  });
  return bowerTask;
});


gulp.task('watch', ['default'], function() {
  gulp.watch(_.flatten([app, assets, partials]), ['assets', 'app']);
  gulp.watch(['stylesheets/**/*.styl'], ['stylesheets']);
  gulp.watch(['../src/**/*.js', 'templates/**/*.html', 'templates/**/*.js'], ['api']);
  gulp.watch(guides, ['guides']);
});


function copyPackage(srcFolder) {
  return function (name) {
    var patterns = _.toArray(arguments).slice(1);
    patterns[0] = patterns[0] || '**/*';
    var srcs = _.map(patterns, function(pattern) {
      return path.join(srcFolder,name,pattern);
    });

    return gulp.src(srcs)
    .pipe(streamForEach(function (f) {
      _.extend(f, {
        base: '.',
        path: path.join(name, f.relative)
      });
    }));
  };
}

