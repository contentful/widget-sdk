const path = require('path');
const webpack = require('webpack');
const { createBabelOptions } = require('./tools/app-babel-options');

/**
 * @description webpack's configuration factory
 * @param {boolean} params.dev – if dev is false:
 *   - process.env.NODE_ENV is set to "production"
 *   - we omit moment.js' locales
 *   - global variable IS_PRODUCTION is set to `true`
 *   - source-map is slower, but more extensive
 */
module.exports = () => {
  const nodeEnv = process.env.NODE_ENV;
  const isProd = nodeEnv === 'production';

  const { rules: envRules, ...envConfig } = isProd
    ? require('./tools/webpack.prod.config')
    : require('./tools/webpack.dev.config');

  const fileLoaderName = isProd ? '[name]-[contenthash].[ext]' : '[name].[ext]';

  return {
    ...envConfig,
    entry: {
      app: [
        require.resolve('./vendor/bcsocket-shim'),
        require.resolve('./src/javascripts/prelude'),
      ],
      styles: require.resolve('./src/stylesheets/main.css', { extensions: ['.css'] }),
      favicons: [
        './src/images/favicons/favicon32x32.png',
        './src/images/favicons/apple_icon57x57.png',
        './src/images/favicons/apple_icon72x72.png',
        './src/images/favicons/apple_icon114x114.png',
      ].map((file) => require.resolve(file, { extensions: ['.png'] })),
    },
    resolve: {
      modules: ['node_modules', 'src/javascripts'],
      extensions: ['.js', '.ts', '.tsx'],
      alias: {
        'saved-views-migrator': path.resolve('src/javascripts/libs/saved-views-migrator'),
      },
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        vm: require.resolve('vm-browserify'),
        stream: require.resolve('stream-browserify'),
        events: require.resolve('events/'),
      },
    },
    module: {
      rules: [
        {
          // All JS files
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: createBabelOptions({
                cacheDirectory: !isProd,
              }),
            },
          ],
        },
        {
          // All HTML files
          test: /\.html$/,
          issuer: [
            // javascript can import html as strings
            /\.(js|ts)x?$/,
            // allow the dev and production index html files to import the body content
            /index\.(dev\.)?html/,
          ],
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: isProd,
              },
            },
          ],
        },
        // All image files from any non-JS file that are not favicons, see below.
        //
        // These image files are put into build/app directly
        {
          test: /.(png|jpe?g|gif|eot|ttf|woff|otf|svg)$/i,
          issuer: /\.css$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: fileLoaderName,
                outputPath: function (url) {
                  return `assets/${url}`;
                },
              },
            },
          ],
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
                name: fileLoaderName,
                outputPath: function (url) {
                  return `assets/${url}`;
                },
              },
            },
          ],
        },
        {
          // All SVGs used in the app
          //
          // These SVGs are turned into a React component automatically
          test: /.svg$/,
          issuer: /\.(js|ts)x?$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: {
                    removeViewBox: false,
                  },
                },
              },
            },
          ],
        },
        ...(envRules || []),
      ],
    },
    plugins: [
      ...envConfig.plugins,
      // moment.js by default bundles all locales, we want to remove them
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // or google `moment webpack locales`
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ].filter(Boolean),
    stats: 'minimal',
  };
};
