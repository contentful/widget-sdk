/**
 * @description This is a webpack configuration to process _most_ of the JS files.
 * For example, `templates.js` is created by gulp.
 *
 * Because of the way our legacy Karma tests are setup, using SystemJS, we can
 * currently only import JS and JSON files, but the rest must be processed in
 * another way, either via Gulp (like Jade templates), or by using a loader
 * and writing a new loader for SystemJS. In theory it would work, but dragons
 * are there.
 *
 * Hence, styles and templates (written using Jade/Pug) use gulp for processing.
 * However, you can still use custom loader, just avoid requiring non-js files
 * in generic files (otherwise some tests can file).
 */

const webpack = require('webpack');
const path = require('path');
const { createBabelOptions } = require('./app-babel-options');
const WebpackRequireFrom = require('webpack-require-from');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');

/**
 * @description webpack's configuration factory
 * @param {boolean} params.dev – if dev is false:
 *   - process.env.NODE_ENV is set to "production"
 *   - we omit moment.js' locales
 *   - global variable IS_PRODUCTION is set to `true`
 *   - source-map is slower, but more extensive
 */
module.exports = () => {
  const currentEnv = process.env.NODE_ENV;
  const isDev = /^(dev|development)$/.test(currentEnv) || !currentEnv;
  const isProd = currentEnv === 'production';
  const isTest = currentEnv === 'test';

  const projectRoot = path.resolve(__dirname, '..');

  const appEntry = {
    // Main app bundle, with vendor files such as bcsocket and jquery-shim
    'app.js': [
      './vendor/jquery-shim.js',

      // Custom jQuery UI build: see the file for version and contents
      './vendor/jquery-ui/jquery-ui.js',
      './vendor/bcsocket-shim.js',
      './src/javascripts/prelude.js'
    ]
  };

  const testDepEntry = {
    // Dependency file, generated for tests (systemJs does not handle require statements
    // at all, making some dependency handling particularly challenging)
    'dependencies.js': ['./build/dependencies-pre.js']
  };

  return {
    entry: Object.assign(
      {
        styles: [
          './src/stylesheets/font-awesome/font-awesome.css',

          // Not sure if we need this
          './src/stylesheets/html5reset-1.6.1.css',
          './node_modules/codemirror/lib/codemirror.css',
          // Add angular styles since we are disabling inline-styles in ngCsp
          './node_modules/angular/angular-csp.css',
          './node_modules/@contentful/forma-36-react-components/dist/styles.css',
          './node_modules/@contentful/forma-36-fcss/dist/styles.css',
          './src/stylesheets/legacy-styles.css'
        ]
      },
      !isTest ? appEntry : {},
      isTest ? testDepEntry : {}
    ),
    output: {
      filename: '[name]',
      path: path.resolve(projectRoot, 'public', 'app'),
      publicPath: '/app/',
      chunkFilename: isDev ? 'chunk_[name].js' : 'chunk_[name]-[contenthash].js'
    },
    mode: isProd ? 'production' : 'development',
    resolve: {
      modules: ['node_modules', 'src/javascripts'],
      alias: {
        'saved-views-migrator': path.resolve(
          projectRoot,
          'src',
          'javascripts',
          'libs',
          'saved-views-migrator',
          'index.js'
        )
      }
    },
    module: {
      rules: [
        {
          // All JS files
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: createBabelOptions({
              compact: isProd
            })
          }
        },
        {
          // All HTML files
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: isProd
              }
            }
          ]
        },
        {
          // All CSS files
          //
          // Creates a single file from the entrypoint above and
          // outputs to public/app
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDev
              }
            }
          ]
        },
        // All image files from any CSS file.
        //
        // These image files are put into build/app directly
        {
          test: /.(png|jpe?g|gif|eot|ttf|woff|otf|svg)$/i,
          issuer: {
            test: /\.css$/
          },
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name]-[contenthash].[ext]',
                outputPath: function(url) {
                  return `assets/${url}`;
                }
              }
            }
          ]
        },
        {
          // All SVGs used in the app
          //
          // These SVGs are turned into a React component automatically
          test: /.svg$/,
          issuer: {
            test: /\.js$/
          },
          use: [
            {
              loader: '@svgr/webpack'
            }
          ]
        }
      ]
    },
    plugins: [
      new WebpackRequireFrom({
        methodName: 'WebpackRequireFrom_getChunkURL',

        // We suppress errors here since we have non-JS entrypoints
        suppressErrors: true
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css'
      })
    ]
      .concat(
        // moment.js by default bundles all locales, we want to remove them
        // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
        // or google `moment webpack locales`
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
      )
      .concat(
        isDev
          ? [
              new webpack.ProgressPlugin({
                entries: true,
                modules: true,
                modulesCount: 1500,
                profile: true
              })
            ]
          : []
      ),

    // For development, we're using `cheap-module-source-map` as this allows
    // us to see errors and stack traces with Karma rather than just "Script error".
    devtool: isDev ? 'cheap-module-source-map' : false,
    optimization: {
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
      chunkIds: isDev ? 'named' : false,
      splitChunks: {
        // TODO: Make this a bit cleaner
        cacheGroups: !isTest
          ? {
              app: {
                name: 'main',
                test: (_, chunks) => {
                  if (chunks[0] && chunks[0].name === 'app.js') {
                    return false;
                  }

                  // If any of the chunks that would be generated contain a `src/javascripts` file,
                  // include them in this bundle.
                  if (anyChunkHasSrcJavascripts(chunks)) {
                    return true;
                  }

                  // Do not include anything else in this bundle.
                  return false;
                },
                chunks: 'all'
              }
            }
          : {}
      }
    },
    stats: {
      // Set the maximum number of modules to be shown
      maxModules: 1
    }
  };
};

function anyChunkHasSrcJavascripts(chunks) {
  return Boolean(
    chunks.find(chunk => {
      const chunkModules = Array.from(chunk._modules);

      return chunkModules.find(_module => {
        return _module.userRequest && _module.userRequest.split('/src/javascripts/').length !== 1;
      });
    })
  );
}
