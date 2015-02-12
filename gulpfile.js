'use strict';

var _           = require('lodash-node/modern');
var Promise     = require('promise');
var awspublish  = require('gulp-awspublish');
var browserify  = require('browserify');
var clean       = require('gulp-clean');
var concat      = require('gulp-concat');
//var debug       = require('gulp-debug');
var ecstatic    = require('ecstatic');
var exec        = require('child_process').exec;
var express     = require('express');
var filter      = require('gulp-filter');
var fingerprint = require('gulp-fingerprint');
var fs          = require('fs');
var gulp        = require('gulp');
var gulpif      = require('gulp-if');
var gutil       = require('gulp-util');
var http        = require('http');
var inject      = require('gulp-inject');
var jade        = require('gulp-jade');
var jstConcat   = require('gulp-jst-concat');
var nib         = require('nib');
var replace     = require('gulp-regex-replace');
var rev         = require('gulp-rev');
var runSequence = require('run-sequence');
var source      = require('vinyl-source-stream');
var sourceMaps  = require('gulp-sourcemaps');
var stylus      = require('gulp-stylus');
var uglify      = require('gulp-uglify');

var gitRevision;
var packaging     = false;
var settings      = _.omit(require('./config/environment.json'), 'fog');
var s3credentials = require('./config/environment.json').fog.s3;

var src = {
  templates:   'src/javascripts/**/*.jade',
  components:  'src/javascripts/**/*.js',
  stylesheets: 'src/stylesheets/**/*',
  vendorScripts: [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/jquery-ui/ui/jquery.ui.core.js',
    'bower_components/jquery-ui/ui/jquery.ui.position.js',
    'bower_components/jquery-ui/ui/jquery.ui.widget.js',
    'bower_components/jquery-ui/ui/jquery.ui.mouse.js',
    'bower_components/jquery-ui/ui/jquery.ui.sortable.js',
    'bower_components/jquery-ui/ui/jquery.ui.draggable.js',
    'bower_components/jquery-ui/ui/jquery.ui.autocomplete.js',
    'bower_components/jquery-ui/ui/jquery.ui.datepicker.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-load/angular-load.js',
    'bower_components/angular-sanitize/angular-sanitize.js',
    'bower_components/angular-route/angular-route.js',
    'bower_components/angular-ui-sortable/sortable.js',
    'bower_components/bootstrap/js/tooltip.js',
    'bower_components/speakingurl/lib/index.js',

    'vendor/**/*.js',

    'node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed.js',
    'node_modules/share/webclient/share.uncompressed.js',
    'node_modules/share/webclient/json.uncompressed.js',
    'node_modules/share/webclient/textarea.js',
  ],
  vendorScriptsNonEssential: {
    kaltura: [
      'kaltura*/webtoolkit.md5.js',
      'kaltura*/ox.ajast.js',
      'kaltura*/KalturaClientBase.js',
      'kaltura*/KalturaTypes.js',
      'kaltura*/KalturaVO.js',
      'kaltura*/KalturaServices.js',
      'kaltura*/KalturaClient.js'
    ]
  },
  images: [
    'src/images/**/*',
    './bower_components/jquery-ui/themes/base/images/*'
  ],
  static: [
    'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
    'node_modules/zeroclipboard/ZeroClipboard.swf'
  ],
  vendorStylesheets: [
    './vendor/**/*.css',
    './bower_components/jquery-ui/themes/base/jquery-ui.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.autocomplete.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.datepicker.css',
  ],
  mainStylesheets: [
    'src/stylesheets/main.styl',
    'src/stylesheets/ie9.css'
  ]
};

gulp.task('copy-static', function () {
  return gulp.src(src.static)
    .pipe(gulp.dest('./public/app'));
});

gulp.task('copy-images', function () {
  return gulp.src(src.images)
    .pipe(gulp.dest('./public/app/images'));
});

gulp.task('index', function(){
  gulp.src('src/index.html')
    .pipe(replace({regex: 'window.CF_CONFIG =.*', replace: 'window.CF_CONFIG = '+JSON.stringify(settings)+';'}))
    .pipe(gulp.dest('public'));
});

gulp.task('templates', function () {
  return gulp.src(src.templates)
    .pipe(jade({doctype: 'html'}))
    .on('error', errorHandler('Jade'))
    .pipe(jstConcat('templates.js', {
      renameKeys: ['^.*/(.*?).html$', '$1']
    }))
    .pipe(gulp.dest('./public/app'));

});

gulp.task('vendor-js', function () {
  return gulp.src(src.vendorScripts)
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourceMaps.write({sourceRoot: '/vendor'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('vendored-js-non-essential', function () {
  // Hardcoded to kaltura. Fix this when needed
  return gulp.src(src.vendorScriptsNonEssential.kaltura)
    .pipe(sourceMaps.init())
    .pipe(uglify())
    .pipe(concat('kaltura.js'))
    .pipe(sourceMaps.write({sourceRoot: '/vendor/kaltura'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('user_interface', function () {
  return bundleBrowserify(createBrowserify());
});

gulp.task('watchify', function(){
  var watchify = require('watchify');
  var ui = watchify(createBrowserify(watchify.args));
  bundleBrowserify(ui);

  ui.on('update', function() {
    gutil.log('Rebuilding \'user_interface\' bundle...');
    bundleBrowserify(ui)
    .on('end', function(){
      gutil.log('Rebuilding \'user_interface\' bundle done');
    });
  });
});

function createBrowserify(args) {
  return browserify(_.extend({debug: true}, args))
    .add('./src/user_interface')
    .transform({optimize: 'size'}, 'browserify-pegjs');
}

function bundleBrowserify(browserify) {
  return browserify.bundle()
    .on('error', errorHandler('Browserify'))
    .pipe(source('user_interface.js'))
    .pipe(gulp.dest('./public/app/'));
}

gulp.task('git-revision', function(cb){
  exec('git log -1 --pretty=format:%H', function(err, sha){
    gitRevision = sha;
    cb(err);
  });
});

gulp.task('components', ['git-revision'], function () {
  return gulp.src(src.components)
    .pipe(gulpif('**/environment.js',
      replace({ regex: 'GULP_GIT_REVISION', replace: gitRevision})))
    .pipe(sourceMaps.init())
    .pipe(concat('components.js'))
    .pipe(sourceMaps.write({sourceRoot: '/components'}))
    .pipe(gulp.dest('./public/app/'));
});

gulp.task('vendor_stylesheets', function () {
   return gulp.src(src.vendorStylesheets)
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.css'))
    .pipe(sourceMaps.write({sourceRoot: '/vendor'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('stylesheets', function () {
  return gulp.src(src.mainStylesheets)
    .pipe(sourceMaps.init())
    .pipe(stylus({
      use: nib(),
      //compress: true
    }))
    .on('error', errorHandler('Stylus'))
    .pipe(sourceMaps.write({sourceRoot: '/stylesheets'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('all', ['index', 'templates', 'vendor-js', 'vendored-js-non-essential', 'user_interface', 'components', 'copy-images', 'copy-static', 'stylesheets', 'vendor_stylesheets']);

gulp.task('clean', function () {
  return gulp.src([
    './public/app',
    './build/*',
    './public/index.html'
  ], {read: false})
    .pipe(clean());
});

gulp.task('serve', function () {
  var builds = [];
  watchTask('components');
  watchTask('templates');
  watchTask('stylesheets');

  function watchTask(taskName) {
    gulp.watch(src[taskName], function () {
      builds.push(new Promise(function (resolve) {
        runSequence(taskName, resolve);
      }));
    });
  }

  var app = express();
  app.use(ecstatic({ root: __dirname + '/public', handleError: false, showDir: false }));
  app.all('*', function(req, res) {
    var index = fs.readFileSync('public/index.html', 'utf8');
    Promise.all(builds).then(function () {
      res.status(200).send(index);
      builds = [];
    });
  });
  http.createServer(app).listen(3001);
});

gulp.task('serve-production', function(){
  var app = express();
  app.use(ecstatic({ root: __dirname + '/build', handleError: false, showDir: false }));
  app.all('*', function(req, res) {
    var index = fs.readFileSync('build/index.html', 'utf8');
    res.status(200).send(index);
  });
  http.createServer(app).listen(3001);
});



// PRODUCTION: //////////////////////////////////////////

gulp.task('rev-static', function(){
  return gulp.src(['public/app/**', '!**/!(kaltura).js', '!**/*.css'], {base: 'public'})
    .pipe(gulp.dest('build'))
    .pipe(rev())
    .pipe(gulp.dest('build'))
    .pipe(rev.manifest({path: 'static-manifest.json'}))
    .pipe(gulp.dest('build'));
});

gulp.task('rev-dynamic', function(){
  var filterCss = filter('**/*.css');
  var filterMaps = filter('**/*.css');
  return gulp.src([
    'public/app/main.css',
    'public/app/ie9.css',
    'public/app/vendor.css',

    'public/app/templates.js',
    'public/app/vendor.js',
    'public/app/user_interface.js',
    'public/app/components.js',
  ], {base: 'public'})
    .pipe(filterCss)
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(sourceMaps.write('.', {addComment: false}))
      .pipe(filterMaps)
    .pipe(filterCss.restore())
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(fingerprint(
      'build/static-manifest.json', {
        mode: 'replace',
        verbose: false,
        prefix: '/'
      }))
    .pipe(sourceMaps.write())
    .pipe(gulp.dest('build'))
    .pipe(rev())
    .pipe(gulp.dest('build'))
    .pipe(rev.manifest({path: 'dynamic-manifest.json'}))
    .pipe(gulp.dest('build'));
});

gulp.task('rev-app', function () {
  return gulp.src([
    'build/app/vendor-*.js',
    'build/app/user_interface-*.js',
    'build/app/components-*.js',
    'build/app/templates-*.js',
  ])
    .pipe(sourceMaps.init({ loadMaps: true }))
    .pipe(concat('application.min.js'))
    .pipe(uglify())
    .pipe(rev())
    .pipe(sourceMaps.write('.', {
      sourceRoot: '/javascript',
      sourceMappingURLPrefix: '//'+settings.app_host+'/app/'
    }))
    .pipe(gulp.dest('build/app'))
    .pipe(rev.manifest({path: 'app-manifest.json'}))
    .pipe(gulp.dest('build'));
});

gulp.task('rev-index', function(){
  var manifest = _.extend(
    require('./build/static-manifest.json'),
    require('./build/dynamic-manifest.json')
  );
  return gulp.src(packaging ? 'src/index.html' : 'public/index.html')
    .pipe(fingerprint(manifest, { prefix: '//'+settings.asset_host+'/'}))
    .pipe(inject(
      gulp.src('app/application.min-*.js', {read: false, cwd: 'build'}),
      {
        addPrefix: '//'+settings.asset_host,
        addRootSlash: false
      }
    ))
    .pipe(gulp.dest('build'));
});

gulp.task('revision', ['git-revision'], function(){
  var stream = source('revision.json');
  stream.write(JSON.stringify({revision: gitRevision}));
  return stream.pipe(gulp.dest('build'));
});

gulp.task('aws-publish', function(){
  var publisher = awspublish.create({
    key:    s3credentials.options.aws_access_key_id,
    secret: s3credentials.options.aws_secret_access_key,
    bucket: s3credentials.asset_sync.bucket,
    region: s3credentials.asset_sync.region,
  });

  return gulp.src(['build/**', '!**/*.js.map'])
    .pipe(gulpif('index.html',
       publisher.publish({
         'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
       }, {force: true}),
       publisher.publish({
         'Cache-Control': 'max-age=315360000, public'
       }, {force: true})))
    .pipe(awspublish.reporter());
});

gulp.task('prod', function(done){
  runSequence(
    'rev-static',
    'rev-dynamic',
    'rev-app',
    'rev-index',
    'revision',
    done
  );
});

gulp.task('build', function(done){
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

gulp.task('package', function(done){
  packaging = true;
  runSequence('build', done);
});

function errorHandler(label) {
  return function handleError(e) {
    gutil.log(gutil.colors.red(label + ' error:'), e.message);
  };
}
