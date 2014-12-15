'use strict';

var _           = require('lodash-node/modern');
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

var env = process.env.UI_ENV || 'development';
var config = require('./config/environments/'+env+'/config.json');

var src = {
  templates: './app/assets/javascripts/**/*.jst.jade',
  components: './app/assets/javascripts/**/*.js',
  stylesheets: './app/assets/stylesheets/**/*',
  vendorScripts: [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/jquery-ui/ui/jquery.ui.core.js',
    'bower_components/jquery-ui/ui/jquery.ui.widget.js',
    'bower_components/jquery-ui/ui/jquery.ui.mouse.js',
    'bower_components/jquery-ui/ui/jquery.ui.sortable.js',
    'bower_components/jquery-ui/ui/jquery.ui.autocomplete.js',
    'bower_components/jquery-ui/ui/jquery.ui.datepicker.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-load/angular-load.js',
    'bower_components/angular-sanitize/angular-sanitize.js',
    'bower_components/angular-route/angular-route.js',
    'bower_components/angular-ui/common/module.js',
    'bower_components/angular-ui/modules/directives/sortable/sortable.js',
    'bower_components/bootstrap/js/tooltip.js',

    'vendor/assets/javascripts/jquery.autosize.js',
    'vendor/assets/javascripts/jquery.cookies*.js',
    'vendor/assets/javascripts/jquery-textrange.js',
    'vendor/assets/javascripts/guiders*.js',

    'app/assets/commonjs_modules/user_interface/node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed.js',
    'app/assets/commonjs_modules/user_interface/node_modules/share/webclient/share.uncompressed.js',
    'app/assets/commonjs_modules/user_interface/node_modules/share/webclient/json.uncompressed.js',
    'app/assets/commonjs_modules/user_interface/node_modules/share/webclient/textarea.js',
  ],
  images: [
    './app/assets/images/**/*',
    './bower_components/jquery-ui/themes/base/images/*'
  ],
  fonts: [
    './app/assets/font-awesome/*.+(eot|svg|ttf|woff)',
  ],
  static: [
    './app/assets/commonjs_modules/user_interface/node_modules/zeroclipboard/ZeroClipboard.swf'
  ],
  vendorStylesheets: [
    './app/assets/stylesheets/html5reset*',
    './app/assets/font-awesome/font-awesome.css',
    './vendor/assets/stylesheets/formtastic.css',
    './bower_components/jquery-ui/themes/base/jquery-ui.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.autocomplete.css',
    './bower_components/jquery-ui/themes/base/jquery.ui.datepicker.css',
  ],
  mainStylesheets: [
    './app/assets/stylesheets/main.styl',
    './app/assets/stylesheets/ie9.css'
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

gulp.task('copy-fonts', function () {
  return gulp.src(src.fonts)
    .pipe(gulp.dest('./public/app/fonts'));
});

gulp.task('index', function(){
  return gulp.src('./app/views/application/index.html')
    .pipe(replace( { regex: '<!-- releaseStage -->', replace: '<script>window.Bugsnag.releaseStage = "'+env+'";</script>'}))
    .pipe(gulp.dest('./public'));
});

gulp.task('templates', function () {
  return gulp.src(src.templates)
    .pipe(jade({doctype: 'html'}))
    .pipe(jstConcat('templates.js', {
      renameKeys: ['^.*/(.*?)(\\.jst)?.html$', '$1']
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

gulp.task('user_interface', function () {
  return browserify('./', {
      basedir: './app/assets/commonjs_modules/user_interface/'})
    .transform({optimize: 'size'}, 'browserify-pegjs')
    .bundle({debug: true})
    .pipe(source('user_interface.js'))
    .pipe(gulp.dest('./public/app/'));
});

gulp.task('config-revision', function(cb){
  exec('git log -1 --pretty=format:%H', function(err, sha){
    config.git_revision = sha;
    cb(err);
  });
});

gulp.task('components', ['config-revision'], function () {
  return gulp.src(src.components)
    .pipe(gulpif('**/environment.js',
      replace([
        { regex: 'env: .+',      replace: 'env: \''+env+'\','},
        { regex: 'settings: .+', replace: 'settings: '+JSON.stringify(_.omit(config, 'fog'))}
      ])))
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
    .pipe(stylus({
      use: nib(),
      sourcemap: {
        inline: true,
        sourceRoot: '/stylesheets',
        basePath: 'app/assets/stylesheets'
      }
      //compress: true
    }))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('all', ['index', 'templates', 'vendor-js', 'user_interface', 'components', 'copy-images', 'copy-fonts', 'copy-static', 'stylesheets', 'vendor_stylesheets']);

gulp.task('clean', function () {
  return gulp.src([
    './public/app',
    './build/*',
    './public/index.html'
  ], {read: false})
    .pipe(clean());
});

gulp.task('serve', function () {
  gulp.watch(src.components, ['components']);
  gulp.watch(src.templates , ['templates']);
  gulp.watch(src.stylesheets , ['stylesheets']);
  // TODO: use watchify for user_interface

  var app = express();
  app.use(ecstatic({ root: __dirname + '/public', handleError: false, showDir: false }));
  app.all('*', function(req, res) {
    var index = fs.readFileSync('public/index.html', 'utf8');
    res.status(200).send(index);
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
  return gulp.src([
    'public/app/images/**',
    'public/app/fonts/**',
    'public/app/ZeroClipboard.swf',
  ], {base: 'public'})
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
      'build/static-manifest.json',
      { mode: 'replace', verbose: false, prefix: '/'}
    ))
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
      sourceMappingURLPrefix: '//'+config.app_host+'/app/'
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
  return gulp.src('public/index.html')
    .pipe(fingerprint(manifest, { prefix: '//'+config.asset_host+'/'}))
    .pipe(inject(
      gulp.src('app/application.min-*.js', {read: false, cwd: 'build'}), 
      {
        addPrefix: '//'+config.asset_host,
        addRootSlash: false
      }
    ))
    .pipe(gulp.dest('build'));
});

gulp.task('revision', ['config-revision'], function(){
  var stream = source('revision.json');
  stream.write(JSON.stringify({revision: config.git_revision}));
  return stream.pipe(gulp.dest('build'));
});

gulp.task('aws-publish', function(){
  var publisher = awspublish.create({
    key:    config.fog.s3.options.aws_access_key_id,
    secret: config.fog.s3.options.aws_secret_access_key,
    bucket: config.fog.s3.asset_sync.bucket,
    region: config.fog.s3.asset_sync.region,
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
