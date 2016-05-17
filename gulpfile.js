'use strict';

var _ = require('lodash-node/modern');
var Promise = require('promise');
var browserify = require('browserify');
var glob = require('glob');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var express = require('express');
var fingerprint = require('gulp-fingerprint');
var mkdirp = require('mkdirp');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var inject = require('gulp-inject');
var jade = require('gulp-jade');
var jstConcat = require('./tasks/build-template');
var nib = require('nib');
var replace = require('gulp-regex-replace');
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourceMaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var path = require('path');
var through = require('through2').obj;
var yargs = require('yargs');
var childProcess = require('child_process');
var serve = require('./tasks/serve');

var argv = yargs
.boolean('verbose')
.alias('verbose', 'v')
.argv;


process.env['PATH'] += ':./node_modules/.bin';

var loadSubtasks = require('./tasks/subtasks');
loadSubtasks(gulp, 'docs');

var pexec = Promise.denodeify(exec);
var gitRevision;
var settings = _.omit(require('./config/environment.json'), 'fog');

var src = {
  templates: 'src/javascripts/**/*.jade',
  // All Angular modules except 'cf.lib'
  components: [
    'src/javascripts/**/*.js',
    '!src/javascripts/libs/*.js'
  ],
  stylesheets: 'src/stylesheets/**/*',
  vendorScripts: {
    main: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jquery-ui/ui/jquery.ui.core.js',
      'bower_components/jquery-ui/ui/jquery.ui.position.js',
      'bower_components/jquery-ui/ui/jquery.ui.widget.js',
      'bower_components/jquery-ui/ui/jquery.ui.mouse.js',
      'bower_components/jquery-ui/ui/jquery.ui.sortable.js',
      'bower_components/jquery-ui/ui/jquery.ui.draggable.js',
      'bower_components/jquery-ui/ui/jquery.ui.autocomplete.js',
      'bower_components/jquery-ui/ui/jquery.ui.datepicker.js',
      'bower_components/jquery-textrange/jquery-textrange.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-load/angular-load.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-ui-sortable/sortable.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-breadcrumb/dist/angular-breadcrumb.js',
      'bower_components/angular-bind-html-compile/angular-bind-html-compile.js',
      'bower_components/bootstrap/js/tooltip.js',
      'node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed.js',
      'node_modules/share/webclient/share.uncompressed.js',
      'node_modules/share/webclient/json.uncompressed.js',
      'node_modules/share/webclient/textarea.js'
    ],
    kaltura: [
      'vendor/kaltura-16-01-2014/webtoolkit.md5.js',
      'vendor/kaltura-16-01-2014/ox.ajast.js',
      'vendor/kaltura-16-01-2014/KalturaClientBase.js',
      'vendor/kaltura-16-01-2014/KalturaTypes.js',
      'vendor/kaltura-16-01-2014/KalturaVO.js',
      'vendor/kaltura-16-01-2014/KalturaServices.js',
      'vendor/kaltura-16-01-2014/KalturaClient.js'
    ]
  },
  images: [
    'src/images/**/*',
    './bower_components/jquery-ui/themes/base/images/*'
  ],
  svg: {
    sourceDirectory: 'src/svg',
    outputDirectory: 'public/app/svg',
    outputFile: 'public/app/contentful_icons.js'
  },
  static: [
    'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
    'vendor/fonts.com/*.+(woff|woff2)'
  ],
  vendorStylesheets: [
    './vendor/**/*.css',
    './bower_components/jquery-ui/themes/base/jquery-ui.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.autocomplete.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.datepicker.css',
    './node_modules/codemirror/lib/codemirror.css'
  ],
  mainStylesheets: [
    'src/stylesheets/main.styl'
  ],
  styleguideStylesheets: [
    'styleguide/public/custom.styl'
  ]
};


gulp.task('all', [
  'index',
  'templates',
  'js',
  'copy-images',
  'copy-static',
  'stylesheets'
]);


/**
 * Build all files necessary to run the tests
 */
gulp.task('prepare-tests', ['js/vendor', 'templates', 'js/external-bundle']);


gulp.task('clean', function () {
  return gulp.src([
    './public/app',
    './public/styleguide*',
    './build/*',
    './public/index.html'
  ], {read: false})
    .pipe(clean());
});


gulp.task('copy-static', function () {
  return gulp.src(src.static)
    .pipe(gulp.dest('./public/app'));
});

gulp.task('copy-images', function () {
  return gulp.src(src.images)
    .pipe(gulp.dest('./public/app/images'));
});

gulp.task('index', function () {
  gulp.src('src/index.html')
    .pipe(replace({
      regex: 'window.CF_CONFIG =.*',
      replace: 'window.CF_CONFIG = ' + JSON.stringify(settings) + ';'
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('templates', function () {
  var dest = gulp.dest('./public/app');
  return gulp.src(src.templates)
    .pipe(jade({doctype: 'html'}))
    .on('error', passError(dest))
    .pipe(jstConcat('templates.js', {
      renameKeys: ['^.*/(.*?).html$', '$1']
    }))
    .pipe(dest);
});

gulp.task('js', [
  'js/external-bundle',
  'js/app',
  'js/vendor'
]);

gulp.task('js/vendor', [
  'js/vendor/main',
  'js/vendor/markdown',
  'js/vendor/kaltura'
]);

gulp.task('js/vendor/main', function () {
  return gulp.src(src.vendorScripts.main)
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourceMaps.write({sourceRoot: '/vendor'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('js/vendor/markdown', function () {
  var dest = gulp.dest('./public/app/');
  return browserify()
    .add('./src/javascripts/libs/markdown_vendors.js')
    .bundle()
    .on('error', passError(dest))
    .pipe(source('markdown_vendors.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(dest);
});

gulp.task('js/vendor/kaltura', function () {
  return gulp.src(src.vendorScripts.kaltura)
    .pipe(uglify())
    .pipe(concat('kaltura.js'))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('js/external-bundle', function () {
  return bundleBrowserify(createBrowserify());
});

gulp.task('js/app', ['git-revision', 'icons'], function () {
  return gulp.src(src.components.concat([src.svg.outputFile]))
    .pipe(gulpif('**/environment.js',
      replace({ regex: 'GULP_GIT_REVISION', replace: gitRevision })))
    .pipe(sourceMaps.init())
    .pipe(concat('components.js'))
    .pipe(sourceMaps.write({sourceRoot: '/components'}))
    .pipe(gulp.dest('./public/app/'));
});

gulp.task('git-revision', function (cb) {
  exec('git log -1 --pretty=format:%H', function (err, sha) {
    gitRevision = sha;
    cb(err);
  });
});

/**
 * Compress and strip SVG source files and put them into
 * 'public/app/svg'.
 */
gulp.task('svg', function () {
  mkdirp(path.dirname(src.svg.outputDirectory));
  return spawnOnlyStderr('svgo', [
    '--enable', 'removeTitle',
    '-f', src.svg.sourceDirectory,
    '-o', src.svg.outputDirectory
  ]);
});

/**
 * Inline SVGs from 'public/app/svg' as angular service in
 * 'public/app/contentful_icons.js'.
 */
gulp.task('icons', ['svg'], function () {
  mkdirp(path.dirname(src.svg.outputFile));
  return spawnOnlyStderr('./bin/prepare_svg.js', [
    src.svg.outputDirectory,
    src.svg.outputFile
  ]);
});

gulp.task('stylesheets', [
  'stylesheets/vendor',
  'stylesheets/app'
]);

gulp.task('stylesheets/vendor', function () {
  return gulp.src(src.vendorStylesheets)
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.css'))
    .pipe(sourceMaps.write({sourceRoot: '/vendor'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('stylesheets/app', function () {
  return buildStylus(src.mainStylesheets, './public/app');
});

gulp.task('styleguide', ['styleguide/stylesheets'], function () {
  return spawnOnlyStderr('kss-node', [
    '--template', 'styleguide',
    '--helpers', 'styleguide/helpers',
    '--source', 'src/stylesheets',
    '--destination', 'public/styleguide',
    '--placeholder', ''
  ]);
});

gulp.task('styleguide/stylesheets', function () {
  return buildStylus('styleguide/custom.styl', './public/styleguide');
});

gulp.task('serve', function () {
  var svgPattern = path.join(src.svg.sourceDirectory, '**/*.svg');
  var appSrc = [svgPattern].concat(src.components);

  var patternTaskMap = [
    [appSrc, ['js/app']],
    [src.templates, ['templates']],
    ['styleguide/**/*', ['styleguide']],
    [src.stylesheets, ['stylesheets', 'styleguide']]
  ];

  return serve(patternTaskMap);
});

gulp.task('watchify', function () {
  var watchify = require('watchify');
  var ui = watchify(createBrowserify(watchify.args));
  bundleBrowserify(ui);

  ui.on('update', function () {
    gutil.log('Rebuilding \'user_interface\' bundle...');
    bundleBrowserify(ui)
    .on('end', function () {
      gutil.log('Rebuilding \'user_interface\' bundle done');
    });
  });
});



function createBrowserify (args) {
  return browserify(_.extend({debug: true}, args))
    .add('./src/javascripts/libs')
    .transform({optimize: 'size'}, 'browserify-pegjs');
}

function bundleBrowserify (browserify) {
  var dest = gulp.dest('./public/app/');
  return browserify.bundle()
    .on('error', passError(dest))
    .pipe(source('libs.js'))
    .pipe(dest);
}

function buildStylus (sources, dest) {
  dest = gulp.dest(dest);
  return gulp.src(sources)
    .pipe(sourceMaps.init())
    .pipe(stylus({use: nib()}))
    .on('error', passError(dest))
    .pipe(sourceMaps.write({sourceRoot: '/stylesheets'}))
    .pipe(dest);
}

function respond404 (_, res) {
  res.sendStatus(404);
}

/**
 * Create a middleware that serves *all* GET requests that accept HTML
 * with `dir/index.html`.
 */
function sendIndex (dir) {
  return function (req, res, next) {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(path.join(dir, 'index.html'));
    } else {
      next();
    }
  };
}


/**
 * Production Builds
 * =================
 *
 * This task creates the production build in the `build` directory.
 *
 * It uses the files created by the `all` tasks in `public/app`.
 * The `rev-static`, `rev-dynamic` and `rev-app` tasks fingerprint
 * these files and create manfests for them. The `rev-index` task then
 * inserts the fingerprinted links into the `index.html`
 *
 * Fingerprinting
 * --------------
 *
 * We use `gulp-rev` for fingerprinting assets. This works as follows.
 *
 * - `rev()` is a transformer that calculates a checksum and renames
 *   every file by appending the checksum to its name.
 *
 * - `rev.manifest()` is a transformer that creates a json file that
 *   maps each non-fingerprinted file to its fingerprinted version.
 */
gulp.task('build', function (done) {
  runSequence(
    'clean',
    'all',
    'rev-static',
    'rev-dynamic',
    'rev-app',
    'rev-index',
    'revision',
    done
  );
});

gulp.task('build/with-styleguide', function (done) {
  runSequence(
    'build',
    'styleguide',
    'build/copy-styleguide',
    done
  );
});

gulp.task('build/copy-styleguide', function () {
  return gulp.src('public/styleguide/**/*')
  .pipe(writeBuild('styleguide'));
});

gulp.task('serve-production', function () {
  var buildDir = path.resolve(__dirname, 'build');

  var app = express();
  app.use(express.static(buildDir));
  app.use(sendIndex(buildDir));
  app.use(respond404);
  app.listen(3001);
  return pexec('./bin/process_hosts');
});

function writeBuild (dir) {
  return gulp.dest(path.join('build', dir || ''));
}

/**
 * Copy all non-JS and non-CS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('rev-static', function () {
  var files = glob.sync('public/app/**/*.!(js|css)');
  files.push('public/app/kaltura.js');
  files.push('public/app/markdown_vendors.js');

  return gulp.src(files, {base: 'public'})
    .pipe(writeBuild())
    .pipe(rev())
    .pipe(writeBuild())
    .pipe(rev.manifest(('static-manifest.json')))
    .pipe(writeBuild());
});

/**
 * Copy the application’s main JS and CSS files from `public/app` to
 * `build` and create a manifest for them.
 *
 * - Replaces references to assets with their fingerprinted version
 *   from the `rev-static` manifest.
 *
 * - Extracts source maps contained in the files and writes them
 *   to a separate `.maps` file.
 */
gulp.task('rev-dynamic', function () {
  return gulp.src([
    'public/app/main.css',
    'public/app/vendor.css',

    'public/app/templates.js',
    'public/app/vendor.js',
    'public/app/libs.js',
    'public/app/components.js'
  ], {base: 'public'})
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(removeSourceRoot())
    .pipe(fingerprint(
      'build/static-manifest.json', {
        mode: 'replace',
        verbose: false,
        prefix: '/'
      }))
    .pipe(writeBuild())
    .pipe(rev())
    .pipe(writeBuild())
    .pipe(sourceMaps.write('.'))
    .pipe(writeBuild())
    .pipe(rev.manifest('dynamic-manifest.json'))
    .pipe(writeBuild());
});

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('rev-app', function () {
  return gulp.src([
    'build/app/vendor-*.js',
    'build/app/libs-*.js',
    'build/app/components-*.js',
    'build/app/templates-*.js'
  ], {base: 'build'})
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(concat('app/application.min.js'))
    .pipe(uglify())
    .pipe(writeBuild())
    .pipe(rev())
    .pipe(writeBuild())
    .pipe(sourceMaps.write('.', { sourceRoot: '/javascript' }))
    .pipe(writeBuild())
    .pipe(rev.manifest('app-manifest.json'))
    .pipe(writeBuild());
});

/**
 * Copy `index.html` to the build directory and link to fingerprinted
 * assets.
 *
 * Also replaces all JavaScripts with the single, concatenated file.
 */
gulp.task('rev-index', function () {
  var manifest = _.extend(
    require('./build/static-manifest.json'),
    require('./build/dynamic-manifest.json'),
    require('./build/app-manifest.json')
  );
  var javascriptSrc = gulp.src('app/application.min.js', {read: false, cwd: 'build'});

  return gulp.src('src/index.html')
    .pipe(inject(javascriptSrc))
    .pipe(fingerprint(manifest, {prefix: '//' + settings.asset_host + '/'}))
    .pipe(writeBuild());
});

gulp.task('revision', ['git-revision'], function () {
  var stream = source('revision.json');
  stream.end(JSON.stringify({revision: gitRevision}));
  return stream.pipe(writeBuild());
});


function passError (target) {
  return function handleError (e) {
    target.emit('error', e);
  };
}

/**
 * Stream transformer that removes the `sourceRoot` property from a
 * file’s source maps.
 */
function removeSourceRoot () {
  return through(function (file, _, push) {
    if (file.sourceMap) {
      file.sourceMap.sourceRoot = null;
    }
    push(null, file);
  });
}

function spawn (cmd, args, opts) {
  return new Promise(function (resolve, reject) {
    childProcess.spawn(cmd, args, opts)
    .on('exit', function (code, signal) {
      if (code === 0) {
        resolve();
      } else if (signal) {
        reject(new Error('Process killed by signal ' + signal));
      } else {
        reject(new Error('Process exited with status code ' + code));
      }
    })
    .on('error', function (err) {
      reject(err);
    });
  });
}

function spawnOnlyStderr (cmd, args, opts) {
  var stdout = argv.verbose ? process.stdout : 'ignore';
  opts = _.defaults(opts || {}, {
    stdio: ['ignore', stdout, process.stderr]
  });
  return spawn(cmd, args, opts);
}
