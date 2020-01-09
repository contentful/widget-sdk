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
const fs = require('fs');
const { createBabelOptions } = require('./app-babel-options');
const WebpackRequireFrom = require('webpack-require-from');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  const configName = process.env.UI_CONFIG || 'development';
  const projectRoot = path.resolve(__dirname, '..');

  const publicPath = '/app/';

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
        ],
        favicons: [
          './src/images/favicons/favicon32x32.png',
          './src/images/favicons/apple_icon57x57.png',
          './src/images/favicons/apple_icon72x72.png',
          './src/images/favicons/apple_icon114x114.png'
        ]
      },
      !isTest ? appEntry : {},
      isTest ? testDepEntry : {}
    ),
    output: {
      filename: '[name]',
      path: path.resolve(projectRoot, 'public', 'app'),
      publicPath,
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
          issuer: {
            test: /\.js$/
          },
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
        // All image files from any non-JS file that are not favicons, see below.
        //
        // These image files are put into build/app directly
        {
          test: /.(png|jpe?g|gif|eot|ttf|woff|otf|svg)$/i,
          issuer: {
            exclude: /\.js$/
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
        // This block handles favicons specifically.
        //
        // There is a quirk in Webpack that if you give an issuer
        // block, assets loaded via an entrypoint directly don't get
        // handled properly. This means that because we load the
        // favicons above (~L76) in an entrypoint directly, they are
        // not picked up by the previous loader for PNGs.
        //
        // Since the test for this is very granular, it picks only the favicons
        // up.
        {
          test: /favicons\/.*\.png$/i,
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
      }),
      new HtmlWebpackPlugin({
        template: 'index.html',
        inject: false,
        /*
          We generate the template parameters manually below so that
          we can use the `index.html` in a simple lodash template parser
          script, that doesn't need to have `htmlWebpackPlugin.`

          This exposes the following keys to index.html:

          appleIcons: the 3 Apple icons
          favicon: the favicon
          stylesheet: styles.css
          js: app.js
          externalConfig: stringified null uiVersion and the development config

          All above except `externalConfig` are paths to those files (e.g. `/app/styles.css`)
         */
        templateParameters: compilation => {
          const stats = compilation.getStats().toJson({
            assets: true,
            all: false,
            cachedAssets: true
          });

          const appleIcons = stats.assets
            .reduce((acc, asset) => {
              if (asset.name.includes('apple_icon')) {
                acc.push(asset.name);
              }

              return acc;
            }, [])
            .map(name => `${publicPath}${name}`);

          const favicon = `${publicPath}${
            stats.assets.find(asset => asset.name.includes('favicon')).name
          }`;
          const stylesheet = `${publicPath}${
            stats.assets.find(asset => asset.name === 'styles.css').name
          }`;
          const js = `${publicPath}${stats.assets.find(asset => asset.name === 'app.js').name}`;

          return {
            appleIcons,
            favicon,
            stylesheet,
            js,
            externalConfig: JSON.stringify({
              uiVersion: null,
              config: JSON.parse(
                fs
                  .readFileSync(path.resolve(__dirname, '..', 'config', `${configName}.json`))
                  .toString()
              )
            })
          };
        }
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

    // For development and testing, we're using `cheap-module-source-map` as this allows
    // us to see errors and stack traces with Karma rather than just "Script error".
    devtool: isTest || isDev ? 'cheap-module-source-map' : false,
    optimization: {
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
      chunkIds: isTest || isDev ? 'named' : false,
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
