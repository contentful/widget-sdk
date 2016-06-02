'use strict';

require('babel-register');
require('regenerator-runtime/runtime');

var _ = require('lodash-node/modern');
var B = require('bluebird');
var browserify = require('browserify');
var glob = require('glob');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var express = require('express');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jade = require('gulp-jade');
var nib = require('nib');
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourceMaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var path = require('path');
var through = require('through2');
var yargs = require('yargs');
var childProcess = require('child_process');
var rework = require('rework');
var reworkUrlRewrite = require('rework-plugin-url');
var FS = B.promisifyAll(require('fs'));

var U = require('./tools/lib/utils');
var jstConcat = require('./tasks/build-template');
var serve = require('./tasks/serve');
var IndexPage = require('./tools/lib/index-page');
var configureIndex = require('./tools/lib/index-configure').default;
var createManifestResolver = require('./tools/lib/manifest-resolver').create;
var TravisEnv = require('./tools/lib/travis-env');

var travis = TravisEnv.load();

var argv = yargs
.boolean('verbose')
.alias('verbose', 'v')
.argv;


process.env['PATH'] += ':./node_modules/.bin';

var loadSubtasks = require('./tasks/subtasks');
loadSubtasks(gulp, 'docs');

var getGitRevision = _.memoize(function () {
  return U.exec('git rev-parse HEAD')
    .then(function (rev) {
      return rev.trim();
    });
});

var CSS_COMMENT_RE = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

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
      // Required by 'ui/context-menu' service
      'bower_components/jquery-ui/ui/jquery.ui.position.js',
      'bower_components/jquery-ui/ui/jquery.ui.widget.js',
      'bower_components/jquery-ui/ui/jquery.ui.mouse.js',
      // Required by 'angular-ui-sortable'
      // Requires 'jquery.ui.core', 'jquery.ui.mouse', 'jquery.ui.widget'
      'bower_components/jquery-ui/ui/jquery.ui.sortable.js',
      // Requires 'jquery.ui.core'
      'bower_components/jquery-ui/ui/jquery.ui.datepicker.js',
      'bower_components/jquery-textrange/jquery-textrange.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-load/angular-load.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
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

// TODO We should not build the index file. Instead, the server should
// generate it on the fly.
gulp.task('index', function () {
  return U.readJSON('config/development.json')
  .then(function (config) {
    var index = IndexPage.renderDev(config);
    return FS.writeFileAsync('public/index.html', index, 'utf8');
  });
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
  // Use `base: '.'` for correct source map paths
  return gulp.src(src.vendorScripts.main, {base: '.'})
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
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

gulp.task('js/app', ['icons'], function () {
  var srcs = src.components.concat([src.svg.outputFile]);
  // Use `base: '.'` for correct source map paths
  return gulp.src(srcs, {base: '.'})
    .pipe(sourceMaps.init())
    .pipe(concat('components.js'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(gulp.dest('./public/app/'));
});

/**
 * Compress and strip SVG source files and put them into
 * 'public/app/svg'.
 */
gulp.task('svg', function () {
  return U.mkdirp(path.dirname(src.svg.outputDirectory))
  .then(function () {
    return spawnOnlyStderr('svgo', [
      '--enable', 'removeTitle',
      '-f', src.svg.sourceDirectory,
      '-o', src.svg.outputDirectory
    ]);
  });
});

/**
 * Inline SVGs from 'public/app/svg' as angular service in
 * 'public/app/contentful_icons.js'.
 */
gulp.task('icons', ['svg'], function () {
  return U.mkdirp(path.dirname(src.svg.outputDirectory))
  .then(function () {
    return spawnOnlyStderr('./bin/prepare_svg.js', [
      src.svg.outputDirectory,
      src.svg.outputFile
    ]);
  });
});

gulp.task('stylesheets', [
  'stylesheets/vendor',
  'stylesheets/app'
]);

gulp.task('stylesheets/vendor', function () {
  // Use `base: '.'` for correct source map paths
  return gulp.src(src.vendorStylesheets, {base: '.'})
    // Some of the vendor styles contain CSS comments that
    // break 'rework'. We remove them here.
    // See https://github.com/reworkcss/css/issues/24
    .pipe(mapFileContents(function (contents) {
      return contents.replace(CSS_COMMENT_RE, '');
    }))
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.css'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
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
    .pipe(buffer())
    // Add root to source map
    .pipe(sourceMaps.init({loadMaps: true}))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(dest);
}

function buildStylus (sources, dest) {
  dest = gulp.dest(dest);
  return gulp.src(sources)
    .pipe(sourceMaps.init())
    .pipe(stylus({
      use: nib(),
      sourcemap: {inline: true}
    }))
    .on('error', passError(dest))
    .pipe(mapSourceMapPaths(function (src) {
      return path.join('src/stylesheets', src);
    }))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
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
 * TODO rewrite
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
    [
      'build/index', 'build/revision',
      'build/js', 'build/styles', 'build/static'
    ], done
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
});

function writeBuild (dir) {
  return gulp.dest(path.join('build', dir || ''));
}

/**
 * Copy all non-JS and non-CS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('build/static', [
  'js/external-bundle', 'js/vendor',
  'copy-static', 'copy-images'
], function () {
  var files = glob.sync('public/app/**/*.!(js|css)');
  files.push('public/app/kaltura.js');
  files.push('public/app/markdown_vendors.js');

  return gulp.src(files, {base: 'public'})
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile());
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
gulp.task('build/styles', ['build/static', 'stylesheets'], function () {
  var staticManifest = require('./build/static-manifest.json');
  var manifestResolver = createManifestResolver(staticManifest, '/app');
  return gulp.src([
    'public/app/main.css',
    'public/app/vendor.css'
  ], {base: 'public'})
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(removeSourceRoot())
    .pipe(mapSourceMapPaths(function (src) {
      // `gulp-sourcemaps` prepends 'app' to all the paths because that
      // is the base. But we want the path relative to the working dir.
      return path.relative('app', src);
    }))
    .pipe(mapFileContents(function (contents, file) {
      return rework(contents, {source: file.path})
        .use(reworkUrlRewrite(manifestResolver))
        .toString({compress: true, sourcemaps: true});
    }))
    // Need to reload the source maps because 'rework' inlines them.
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(sourceMaps.write('.', {sourceRoot: '/'}))
    .pipe(writeFile())
    .pipe(rev.manifest('build/styles-manifest.json'))
    .pipe(writeFile());
});

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('build/js', ['js', 'templates'], function () {
  return gulp.src([
    'public/app/templates.js',
    'public/app/vendor.js',
    'public/app/libs.js',
    'public/app/components.js'
  ])
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(concat('app/application.min.js'))
    .pipe(uglify())
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    // 'uglify' already prepends a slash to every source path
    .pipe(sourceMaps.write('.', {sourceRoot: null}))
    .pipe(writeFile())
    .pipe(rev.manifest('build/app-manifest.json'))
    .pipe(writeFile());
});

var MANIFEST_PATHS = [
  'build/static-manifest.json',
  'build/styles-manifest.json',
  'build/app-manifest.json'
];

gulp.task('build/index', ['build/js', 'build/styles', 'build/static'], function () {
  var configPath = 'config/' + travis.targetEnv + '.json';
  return getGitRevision()
  .then(function (revision) {
    console.log(
      'Configuring revision %s for environment "%s"',
      revision.substr(0, 8), travis.targetEnv
    );
    return configureIndex(
      revision, configPath, MANIFEST_PATHS,
      'build/index.html'
    );
  });
});

gulp.task('build/revision', function () {
  return getGitRevision()
  .then(function (revision) {
    return U.writeJSON('build/revision.json', {revision: revision});
  });
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
  return streamMap(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sourceRoot = null;
    }
    return file;
  });
}

/**
 * Stream transformer that for every file applies a function to all source map paths.
 */
function mapSourceMapPaths (fn) {
  return streamMap(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sources = _.map(file.sourceMap.sources, fn);
    }
    return file;
  });
}

function spawn (cmd, args, opts) {
  return new B(function (resolve, reject) {
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

function changeBase (base) {
  return streamMap(function (file) {
    base = path.resolve(base);
    var filePath = path.join(base, file.relative);
    file.base = base;
    file.path = filePath;
    return file;
  });
}

function writeFile () {
  return gulp.dest(function (file) {
    return file.base;
  });
}

function streamMap (fn) {
  return through.obj(function (file, _, push) {
    push(null, fn(file));
  });
}

function mapFileContents (fn) {
  return streamMap(function (file) {
    var contents = file.contents.toString();
    contents = fn(contents, file);
    file.contents = new Buffer(contents, 'utf8');
    return file;
  });
}
