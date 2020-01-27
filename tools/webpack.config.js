const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { createBabelOptions } = require('./app-babel-options');
const WebpackRequireFrom = require('webpack-require-from');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

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
    app: [
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
    dependencies: ['./build/dependencies-pre.js']
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
      filename: isProd ? '[name]-[contenthash].js' : '[name].js',
      path: path.resolve(projectRoot, 'public', 'app'),
      publicPath,
      chunkFilename: isProd ? 'chunk_[name]-[contenthash].js' : 'chunk_[name].js'
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
          use: [
            // Disable `cache-loader` until a more stable solution (i.e. one that doesn't cause
            // out of memory exceptions) is found.
            // 'cache-loader',
            {
              loader: 'babel-loader',
              options: createBabelOptions({
                compact: isProd
              })
            }
          ]
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
            test: /\.css$/
          },
          use: [
            {
              loader: 'file-loader',
              options: {
                name: isProd ? '[name]-[contenthash].[ext]' : '[name].[ext]',
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
                name: isProd ? '[name]-[contenthash].[ext]' : '[name].[ext]',
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
        filename: isProd ? '[name]-[contenthash].css' : '[name].css',
        chunkFilename: isProd ? '[id]-[contenthash].css' : '[id].css'
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
              }),
              new HtmlWebpackPlugin({
                template: 'index.html',
                inject: false,
                /*
                  We generate the template parameters manually below so that
                  we can use the `index.html` in a simple lodash template parser
                  script, that doesn't need to have `htmlWebpackPlugin.`

                  This exposes to the template a manifest object that contains
                  the manifested assets listed in the array below. This dramatically
                  simplifies creating the compiled index.html when creating for
                  preview/staging/prod.

                  This also exposes the externalConfig, with a `null` uiVersion and the
                  chosen development config.
                 */
                templateParameters: compilation => {
                  const stats = compilation.getStats().toJson({
                    assets: true,
                    all: true,
                    cachedAssets: true
                  });

                  const manifestedAssets = [
                    'app.js',
                    'styles.css',
                    'assets/favicon32x32.png',
                    'assets/apple_icon57x57.png',
                    'assets/apple_icon72x72.png',
                    'assets/apple_icon114x114.png'
                  ];

                  const manifest = manifestedAssets.reduce((acc, asset) => {
                    acc[asset] = `${publicPath}${
                      stats.assets.find(real => real.name === asset).name
                    }`;

                    return acc;
                  }, {});

                  return {
                    manifest,
                    externalConfig: {
                      uiVersion: null,
                      config: JSON.parse(
                        fs
                          .readFileSync(
                            path.resolve(__dirname, '..', 'config', `${configName}.json`)
                          )
                          .toString()
                      )
                    }
                  };
                }
              })
            ]
          : [],
        isProd ? [new ManifestPlugin()] : []
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
              nodeModules: {
                name: 'libs',
                test: module => {
                  if (module.resource && module.resource.split('node_modules').length !== 1) {
                    if (anyIssuerInChainIsIncludedAsync(module)) {
                      return false;
                    }

                    return true;
                  }
                }
              },
              app: {
                name: 'main',
                test: (module, chunks) => {
                  if (module.resource && module.resource.split('node_modules').length !== 1) {
                    return false;
                  }

                  if (chunks[0] && chunks[0].name === 'app') {
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

/*
  This checks to see if the current issuer, or any of its parent issuers, are included
  asynchronously in our application code.

  See below in `issuerIsIncludedAsync` for an explanation on how this works.
 */
function anyIssuerInChainIsIncludedAsync(issuer) {
  if (!issuer.issuer) {
    return false;
  }

  if (issuerIsIncludedAsync(issuer)) {
    return true;
  }

  return anyIssuerInChainIsIncludedAsync(issuer.issuer);
}

/*
  If the current `issuer` is included using `require.ensure`, and
  its parent issuer is from `src/javascripts`, return true.
 */
function issuerIsIncludedAsync(issuer) {
  const asyncDependencyReasonNames = ['RequireEnsureItemDependency'];

  return (
    _.intersection(
      asyncDependencyReasonNames,
      issuer.reasons.map(r => r.dependency.constructor.name)
    ).length !== 0 && issuer.issuer.userRequest.match(/src\/javascripts/)
  );
}
