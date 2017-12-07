'use strict'

require('babel-register')
require('babel-polyfill')

const _ = require('lodash-node/modern')
const B = require('bluebird')
const browserify = require('browserify')
const glob = require('glob')
const clean = require('gulp-clean')
const concat = require('gulp-concat')
const gulp = require('gulp')
const gutil = require('gulp-util')
const jade = require('gulp-jade')
const nib = require('nib')
const rev = require('gulp-rev')
const runSequence = require('run-sequence')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const sourceMaps = require('gulp-sourcemaps')
const stylus = require('gulp-stylus')
const uglify = require('gulp-uglify')
const path = require('path')
const yargs = require('yargs')
const childProcess = require('child_process')
const rework = require('rework')
const reworkUrlRewrite = require('rework-plugin-url')
const fs = require('fs')
const babel = require('gulp-babel')
const co = require('co')
const proxyquire = require('proxyquire')

const S = require('./lib/stream-utils')
const FS = require('./lib/utils').FS
const h = require('./lib/hyperscript').h
const jstConcat = require('../tasks/build-template')
const serve = require('./lib/server').serveWatch
const createManifestResolver = require('./lib/manifest-resolver').create
const makeBabelOptions = require('./app-babel-options').makeOptions

const argv = yargs
.boolean('verbose')
.alias('verbose', 'v')
.argv


process.env['PATH'] += ':./node_modules/.bin'

const CSS_COMMENT_RE = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g

const src = {
  templates: 'src/javascripts/**/*.jade',
  // All Angular modules except 'cf.lib'
  components: [
    'src/javascripts/**/*.js',
    '!src/javascripts/libs/*.js',
    '!src/javascripts/prelude.js'
  ],
  stylesheets: 'src/stylesheets/**/*',
  vendorScripts: {
    main: assertFilesExist([
      'node_modules/jquery/dist/jquery.js',
      // Custom jQuery UI build: see the file for version and contents
      'vendor/jquery-ui/jquery-ui.js',
      'node_modules/jquery-textrange/jquery-textrange.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-animate/angular-animate.js',
      'node_modules/angular-load/angular-load.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-ui-sortable/dist/sortable.js',
      'node_modules/angular-ui-router/release/angular-ui-router.js',
      'node_modules/bootstrap/js/tooltip.js',
      'node_modules/browserchannel/dist/bcsocket-uncompressed.js',
      'vendor/sharejs/webclient/share.uncompressed.js',
      'vendor/sharejs/webclient/json.uncompressed.js'
    ]),
    kaltura: assertFilesExist([
      'vendor/kaltura-16-01-2014/webtoolkit.md5.js',
      'vendor/kaltura-16-01-2014/ox.ajast.js',
      'vendor/kaltura-16-01-2014/KalturaClientBase.js',
      'vendor/kaltura-16-01-2014/KalturaTypes.js',
      'vendor/kaltura-16-01-2014/KalturaVO.js',
      'vendor/kaltura-16-01-2014/KalturaServices.js',
      'vendor/kaltura-16-01-2014/KalturaClient.js'
    ]),
    snowplow: assertFilesExist([
      'vendor/snowplow/sp-2.6.2.js'
    ])
  },
  images: [
    'src/images/**/*',
    './vendor/jquery-ui/images/*'
  ],
  static: [
    'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
    'vendor/fonts.com/*.+(woff|woff2)'
  ],
  vendorStylesheets: assertFilesExist([
    './vendor/ui-extensions-sdk/dist/cf-extension.css',
    './vendor/font-awesome/font-awesome.css',
    // Not sure if we need this
    './vendor/html5reset-1.6.1.css',
    // Custom jQuery UI build: see the file for version and contents
    './vendor/jquery-ui/jquery-ui.css',
    './node_modules/codemirror/lib/codemirror.css',
    // Add angular styles since we are disabling inline-styles in ngCsp
    './node_modules/angular/angular-csp.css'
  ])
}

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', function (e) {
  /* eslint no-console: off */
  console.error(e.err.stack)
})


gulp.task('all', function (done) {
  runSequence(
    ['templates', 'js', 'copy-images', 'copy-static', 'stylesheets'],
    'styleguide',
    done
  )
})

/**
 * Build all files necessary to run the tests
 */
gulp.task('prepare-tests', ['js/vendor', 'templates', 'js/external-bundle'])


gulp.task('clean', function () {
  return gulp.src([
    './public/app',
    './public/styleguide*',
    './build/*'
  ], {read: false})
    .pipe(clean())
})


gulp.task('copy-static', function () {
  return gulp.src(src.static)
    .pipe(gulp.dest('./public/app'))
})

gulp.task('copy-images', ['svg'], function () {
  return gulp.src(src.images)
    .pipe(gulp.dest('./public/app/images'))
})


gulp.task('templates', function () {
  const dest = gulp.dest('./public/app')
  return gulp.src(src.templates)
    .pipe(jade({doctype: 'html'}))
    .on('error', passError(dest))
    .pipe(jstConcat('templates.js', {
      renameKeys: ['^.*/(.*?).html$', '$1']
    }))
    .pipe(dest)
})

gulp.task('js', [
  'js/external-bundle',
  'js/app',
  'js/vendor'
])

gulp.task('js/vendor', [
  'js/vendor/main',
  'js/vendor/kaltura',
  'js/vendor/snowplow'
])

gulp.task('js/vendor/main', function () {
  // Use `base: '.'` for correct source map paths
  return gulp.src(src.vendorScripts.main, {base: '.'})
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(gulp.dest('./public/app'))
})

gulp.task('js/vendor/snowplow', function () {
  return gulp.src(src.vendorScripts.snowplow)
    .pipe(concat('snowplow.js'))
    .pipe(gulp.dest('./public/app'))
})

gulp.task('js/vendor/kaltura', function () {
  return gulp.src(src.vendorScripts.kaltura)
    .pipe(uglify())
    .pipe(concat('kaltura.js'))
    .pipe(gulp.dest('./public/app'))
})

gulp.task('js/external-bundle', function () {
  return bundleBrowserify(createBrowserify())
})

gulp.task('js/app', function () {
  return S.pipe([
    S.join([
      // Use `base: '.'` for correct source map paths
      gulp.src('src/javascripts/prelude.js', {base: '.'}),
      gulp.src(src.components, {base: '.'})
    ]),
    sourceMaps.init(),
    babel(makeBabelOptions({
      browserTargets: ['last 2 versions', 'ie >= 10']
    })),
    concat('components.js'),
    sourceMaps.write({sourceRoot: '/'}),
    gulp.dest('./public/app/')
  ])
})

/**
 * Render some of the SVGs defined as Hyperscript in
 * 'src/javascripts/svg' as SVG files so they can be used as static
 * assets.
 *
 * The SVG files are put into 'public/app/svg'. Once can reference them
 * from stylesheets using `url("/app/svg/my-file.svg")`.
 */
gulp.task('svg', co.wrap(function* () {
  const targetDir = path.resolve('public', 'app', 'svg')
  yield FS.mkdirsAsync(targetDir)

  yield Promise.all([
    'chevron-blue',
    'dd-arrow-down',
    'dd-arrow-down-disabled',
    'dotted-border',
    'logo-label',
    'note-info',
    'note-success',
    'note-warning'
  ].map((icon) => {
    const src = path.resolve('src', 'javascripts', 'svg', icon + '.es6.js')
    const target = path.join(targetDir, icon + '.svg')
    const output = proxyquire.noCallThru()(src, {
      'ui/Framework': {h}
    }).default
    return FS.writeFile(target, output, 'utf8')
  }))
}))

gulp.task('stylesheets', [
  'stylesheets/vendor',
  'stylesheets/app'
])

gulp.task('stylesheets/vendor', function () {
  // Use `base: '.'` for correct source map paths
  return gulp.src(src.vendorStylesheets, {base: '.'})
    // Some of the vendor styles contain CSS comments that
    // break 'rework'. We remove them here.
    // See https://github.com/reworkcss/css/issues/24
    .pipe(mapFileContents(function (contents) {
      return contents.replace(CSS_COMMENT_RE, '')
    }))
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.css'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(gulp.dest('./public/app'))
})

gulp.task('stylesheets/app', function () {
  return buildStylus('src/stylesheets/main.styl', './public/app')
})

gulp.task('styleguide', function (done) {
  runSequence(
    'styleguide/stylesheets',
    'styleguide/copy-assets',
    'styleguide/generate',
    done
  )
})

gulp.task('styleguide/generate', function () {
  return spawnOnlyStderr('kss-node', [
    '--template', 'styleguide',
    '--helpers', 'styleguide/helpers',
    '--source', 'src/stylesheets',
    '--destination', 'public/styleguide',
    '--placeholder', ''
  ])
})

gulp.task('styleguide/copy-assets', function () {
  return gulp.src('public/app/**/*.{js,css}')
  .pipe(gulp.dest('./public/styleguide/app'))
})

gulp.task('styleguide/stylesheets', function () {
  return buildStylus('styleguide/custom.styl', './public/styleguide')
})

gulp.task('serve', function () {
  const configName = process.env.UI_CONFIG || 'development'
  const watchFiles = !process.env.NO_WATCHING

  const appSrc = [ 'src/javascripts/**/*.js' ]
  const patternTaskMap = [
    [appSrc, ['js/app']],
    [src.templates, ['templates']],
    [src.stylesheets, ['stylesheets/app']]
  ]

  return serve(configName, watchFiles, patternTaskMap)
})

gulp.task('watchify', function () {
  const watchify = require('watchify')
  const ui = watchify(createBrowserify(watchify.args))
  bundleBrowserify(ui)

  ui.on('update', function () {
    gutil.log('Rebuilding \'user_interface\' bundle...')
    bundleBrowserify(ui)
    .on('end', function () {
      gutil.log('Rebuilding \'user_interface\' bundle done')
    })
  })
})


function createBrowserify (args) {
  return browserify(_.extend({debug: true}, args))
    .add('./src/javascripts/libs')
    .transform({optimize: 'size'}, 'browserify-pegjs')
    .transform('loose-envify', {global: true}) // Making React smaller and faster
}

function bundleBrowserify (browserify) {
  const dest = gulp.dest('./public/app/')
  return browserify.bundle()
    .on('error', passError(dest))
    .pipe(source('libs.js'))
    .pipe(buffer())
    // Add root to source map
    .pipe(sourceMaps.init({loadMaps: true}))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(dest)
}

function buildStylus (sources, dest) {
  assertFilesExist([sources])
  dest = gulp.dest(dest)
  return gulp.src(sources)
    .pipe(sourceMaps.init())
    .pipe(stylus({
      use: nib(),
      sourcemap: {inline: true}
    }))
    .on('error', passError(dest))
    .pipe(mapSourceMapPaths(function (src) {
      return path.join('src/stylesheets', src)
    }))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(dest)
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
    ['build/js', 'build/styles', 'build/static'],
    done
  )
})

gulp.task('build/with-styleguide', function (done) {
  runSequence(
    'build',
    'styleguide',
    'build/copy-styleguide',
    done
  )
})

gulp.task('build/copy-styleguide', function () {
  return gulp.src('public/styleguide/**/*')
  .pipe(writeBuild('styleguide'))
})


function writeBuild (dir) {
  return gulp.dest(path.join('build', dir || ''))
}

/**
 * Copy all non-JS and non-CS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('build/static', [
  'js/external-bundle', 'js/vendor',
  'copy-static', 'copy-images'
], function () {
  const files = glob.sync('public/app/**/*.!(js|css)')
  files.push('public/app/kaltura.js')
  files.push('public/app/snowplow.js')

  return gulp.src(files, {base: 'public'})
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile())
})

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
  const staticManifest = require('../build/static-manifest.json')
  const manifestResolver = createManifestResolver(staticManifest, '/app')
  return gulp.src([
    'public/app/main.css',
    'public/app/vendor.css'
  ], {base: 'public'})
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(removeSourceRoot())
    .pipe(mapSourceMapPaths(function (src) {
      // `gulp-sourcemaps` prepends 'app' to all the paths because that
      // is the base. But we want the path relative to the working dir.
      return path.relative('app', src)
    }))
    .pipe(mapFileContents(function (contents, file) {
      return rework(contents, {source: file.path})
        .use(reworkUrlRewrite(manifestResolver))
        .toString({compress: true, sourcemaps: true})
    }))
    // Need to reload the source maps because 'rework' inlines them.
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(changeBase('build'))
    .pipe(writeFile())
    .pipe(rev())
    .pipe(writeFile())
    .pipe(sourceMaps.write('.', {sourceRoot: '/'}))
    .pipe(writeFile())
    .pipe(rev.manifest('build/styles-manifest.json'))
    .pipe(writeFile())
})

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
    .pipe(writeFile())
})


function passError (target) {
  return function handleError (e) {
    target.emit('error', e)
  }
}

/**
 * Stream transformer that removes the `sourceRoot` property from a
 * file’s source maps.
 */
function removeSourceRoot () {
  return S.map(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sourceRoot = null
    }
    return file
  })
}

/**
 * Stream transformer that for every file applies a function to all source map paths.
 */
function mapSourceMapPaths (fn) {
  return S.map(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sources = _.map(file.sourceMap.sources, fn)
    }
    return file
  })
}

function spawn (cmd, args, opts) {
  return new B(function (resolve, reject) {
    childProcess.spawn(cmd, args, opts)
    .on('exit', function (code, signal) {
      if (code === 0) {
        resolve()
      } else if (signal) {
        reject(new Error('Process killed by signal ' + signal))
      } else {
        reject(new Error('Process exited with status code ' + code))
      }
    })
    .on('error', function (err) {
      reject(err)
    })
  })
}

function spawnOnlyStderr (cmd, args, opts) {
  const stdout = argv.verbose ? process.stdout : 'ignore'
  opts = _.defaults(opts || {}, {
    stdio: ['ignore', stdout, process.stderr]
  })
  return spawn(cmd, args, opts)
}

function changeBase (base) {
  return S.map(function (file) {
    base = path.resolve(base)
    const filePath = path.join(base, file.relative)
    file.base = base
    file.path = filePath
    return file
  })
}

function writeFile () {
  return gulp.dest(function (file) {
    return file.base
  })
}

function mapFileContents (fn) {
  return S.map(function (file) {
    let contents = file.contents.toString()
    contents = fn(contents, file)
    // eslint-disable-next-line node/no-deprecated-api
    file.contents = new Buffer(contents, 'utf8')
    return file
  })
}

function assertFilesExist (paths) {
  paths.forEach(function (path) {
    const stat = fs.statSync(path)
    if (!stat.isFile()) {
      throw new Error(path + ' is not a file')
    }
  })
  return paths
}
