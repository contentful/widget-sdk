const path = require('path');
const webpack = require('webpack');
const WebpackRequireFrom = require('webpack-require-from');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const mode = 'production';

const output = {
  publicPath: `/app/`,
  path: path.resolve(__dirname, '..', 'public', 'app'),
  filename: '[name]-[contenthash].js',
  chunkFilename: '[name]-[contenthash].js',
};

const rules = [
  {
    // All CSS files
    //
    // Creates a single file from the styles entrypoint and
    // outputs to public/app
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          sourceMap: false,
        },
      },
    ],
  },
];

const plugins = [
  new WebpackRequireFrom({
    methodName: 'WebpackRequireFrom_getChunkURL',

    // We suppress errors here since we have non-JS entrypoints
    suppressErrors: true,
  }),
  new WebpackManifestPlugin({
    fileName: path.join(__dirname, '..', 'public', 'manifest.json'),
  }),
  new webpack.DefinePlugin({
    'process.env': JSON.stringify({ NODE_ENV: process.env.NODE_ENV }),
    ENV_CONFIG: 'null',
  }),
  new MiniCssExtractPlugin({
    filename: '[name]-[contenthash].css',
    chunkFilename: '[id]-[contenthash].css',
  }),
];

const optimization = {
  minimize: true,
  minimizer: [
    new TerserJSPlugin({
      terserOptions: {
        parse: {
          // We want terser to parse ecma 8 code. However, we don't want it
          // to apply any minification steps that turns valid ecma 5 code
          // into invalid ecma 5 code. This is why the 'compress' and 'output'
          // sections only apply transformations that are ecma 5 safe
          // https://github.com/facebook/create-react-app/pull/4234
          ecma: 8,
        },
        compress: {
          ecma: 5,
          warnings: false,
          // Disabled because of an issue with Uglify breaking seemingly valid code:
          // https://github.com/facebook/create-react-app/issues/2376
          // Pending further investigation:
          // https://github.com/mishoo/UglifyJS2/issues/2011
          comparisons: false,
          // Disabled because of an issue with Terser breaking valid code:
          // https://github.com/facebook/create-react-app/issues/5250
          // Pending further investigation:
          // https://github.com/terser-js/terser/issues/120
          inline: 2,
        },
        output: {
          ecma: 5,
          comments: false,
          // Turned on because emoji and regex is not minified properly using default
          // https://github.com/facebook/create-react-app/issues/2488
          ascii_only: true,
        },
        // fix wrong minification for Safari
        // https://github.com/terser/terser/issues/117,
        safari10: true,
        mangle: {
          safari10: true,
        },
      },
    }),
    new OptimizeCSSAssetsPlugin({}),
  ],
  moduleIds: 'deterministic',
  splitChunks: {
    cacheGroups: {
      vendors: {
        test: (module) =>
          /[\\/]node_modules[\\/]/.test(module.resource || '') &&
          /javascript|json/.test(module.type),
        chunks: 'all',
        name: (_module, chunks, cacheGroupKey) => {
          const allChunksNames = chunks.map((item) => item.name).join('_');

          return [cacheGroupKey, allChunksNames].filter(Boolean).join('~');
        },
      },
    },
  },
};

// In production we generate source maps for Bugsnag and use `hidden-source-map`
// to avoid annotating the bundle generated bundle with the sourcemap name.
const devtool = 'hidden-source-map';

const devServer = {
  contentBase: false,
  port: 3001,
  hot: false,
  historyApiFallback: true,
};

module.exports = { mode, output, rules, plugins, optimization, devtool, devServer };
