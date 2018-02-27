/**
 * @description Currently, webpack processes only JS bundles, but not all of them!
 * For example, `templates.js` is created by gulp.
 *
 * Right now we don't use imports/exports feature of webpack, we just concatenating
 * everything, and use SystemJS to register ES6 dependencies.
 */

const { optimize, NamedChunksPlugin, NamedModulesPlugin, DefinePlugin, ProvidePlugin } = require('webpack');

const globSync = require('glob').sync;
const P = require('path');

const ConcatPlugin = require('webpack-concat-plugin');

// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts');

module.exports = ({ dev } = {}) => ({
  entry: {
    'public/app/components.js':
      [
        './src/javascripts/prelude.js',
        './src/javascripts/system.js'
      ]
        .concat(globSync('./src/javascripts/**/*.js', {
          ignore: ['./src/javascripts/libs/*.js', './src/javascripts/prelude.js', './src/javascripts/system.js']
        })),
    'public/app/libs.js': './src/javascripts/libs',
    'public/app/vendor.js': [
      './vendor/jquery-shim.js',
      // Custom jQuery UI build: see the file for version and contents
      './vendor/jquery-ui/jquery-ui.js',
      './node_modules/jquery-textrange/jquery-textrange.js',
      './node_modules/angular/angular.js',
      './node_modules/angular-animate/angular-animate.js',
      './node_modules/angular-load/angular-load.js',
      './node_modules/angular-sanitize/angular-sanitize.js',
      './node_modules/angular-ui-sortable/dist/sortable.js',
      './node_modules/angular-ui-router/release/angular-ui-router.js',
      './node_modules/bootstrap/js/tooltip.js',
      './vendor/bcsocket-shim.js',
      './vendor/sharejs/webclient/share.uncompressed.js',
      './vendor/sharejs/webclient/json.uncompressed.js'
    ],
    'public/app/snowplow.js': './vendor/snowplow/sp-2.6.2.js'
  },
  output: {
    filename: '[name]',
    path: __dirname,
    publicPath: '/app/'
  },
  module: {
    noParse: filename => /sharejs/.test(filename),
    rules: [
      {
        test: /\.es6.js$/,
        exclude: /(node_modules|vendor|packages)/,
        use: {
          loader: 'babel-loader',
          options: {
            moduleIds: true,
            presets: [['@babel/preset-env', {
              targets: {
                browsers: ['last 2 versions', 'ie >= 10']
              }
            }]],
            plugins: [
              ['@babel/plugin-transform-modules-systemjs', {
                systemGlobal: 'AngularSystem'
              }],
              [require('@babel/plugin-proposal-object-rest-spread'), { useBuiltIns: true }]
            ],
            // Get the SystemJS module ID from the source path
            // src/javascripts/a/b/x.es6.js -> a/b/x
            getModuleId: function (path) {
              const absPath = P.resolve(path);
              if (absPath.startsWith(basePath)) {
                return absPath
                  .replace(/\.es6$/, '')
                  .replace(basePath + '/', '');
              } else {
                return path;
              }
            }
          }
        }
      },
      {
        // we need to process only es5 files, so pure regex would be too complicated
        test: function (path) {
          // explicitly avoid es6 files
          if (/\.es6.js$/.test(path)) {
            return false;
          }

          return /\.js$/.test(path);
        },
        exclude: /(node_modules|vendor|packages)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', {
              targets: {
                browsers: ['last 2 versions', 'ie >= 10']
              }
            }]],
            plugins: [
              [require('@babel/plugin-proposal-object-rest-spread'), { useBuiltIns: true }]
            ]
          }
        }
      },
      {
        test: /\.pegjs$/,
        loader: 'pegjs-loader'
      }
    ]
  },
  plugins: [
    // we don't need this plugin. The problem is that we actually
    // tell webpack here to use `jquery` module automatically,
    // and not the `window.$` version (same for lodash).
    // this is attached to the `window` directly.
    // new ProvidePlugin({
    //   _: 'lodash',
    //   $: 'jquery',
    //   jQuery: 'jquery',
    //   'window.jQuery': 'jquery'
    // }),

    // we want to concat all kaltura files without wrapping them into
    // independent webpack modules
    // it is extremely hard to do in webpack - https://webpack.js.org/plugins/module-concatenation-plugin/
    // concatenation plugin does not concat them for two reasons:
    // 1. They are not ES modules (no imports/exports)
    // 2. One file (ox.ajast.js) contains `eval`
    new ConcatPlugin({
      uglify: !dev,
      sourceMap: !dev,
      outputPath: 'public/app/',
      fileName: 'kaltura.js',
      filesToConcat: [
        './vendor/kaltura-16-01-2014/webtoolkit.md5.js',
        './vendor/kaltura-16-01-2014/ox.ajast.js',
        './vendor/kaltura-16-01-2014/KalturaClientBase.js',
        './vendor/kaltura-16-01-2014/KalturaTypes.js',
        './vendor/kaltura-16-01-2014/KalturaVO.js',
        './vendor/kaltura-16-01-2014/KalturaServices.js',
        './vendor/kaltura-16-01-2014/KalturaClient.js'
      ]
    })
  ].concat(dev ? [] : [
    // a lot of libraries rely on this env variable in order to cut warnings,
    // development features, etc. e.g. for react: https://reactjs.org/docs/optimizing-performance.html#webpack
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
    // we minify all JS files after concatenation in `build/js` gulp task
    // so we don't need to uglify it here
    // new UglifyJsPlugin({ sourceMap: true })
  ]),
  devtool: dev ? 'eval-source-map' : 'source-map'
});
