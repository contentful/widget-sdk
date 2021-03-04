const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

const isTest = process.env.NODE_ENV === 'test';

// env config for ?ui_version=
const configName = process.env.UI_CONFIG || 'development';
const uiConfigPath = path.resolve('config', `${configName}.json`);

const mode = 'development';
const target = 'web';

const output = {
  publicPath: '/',
  path: path.resolve(__dirname, 'public'),
  pathinfo: false,
};

const rules = [
  {
    test: /\.css$/i,
    // use ExtractCssChunks for stylesheets as it works better with HMR
    // TODO: consider also using this instead of MiniCssExtractPlugin in prod
    use: [{ loader: ExtractCssChunks.loader, options: { hmr: !isTest } }, 'css-loader'],
  },
];

const plugins = [
  new HtmlWebpackPlugin({
    template: path.join(__dirname, '..', 'index.dev.html'),
    favicon: path.join(__dirname, '..', 'src', 'images', 'favicons', 'favicon32x32.png'),
  }),
  !isTest && new ReactRefreshWebpackPlugin({ overlay: false }),
  new webpack.ProgressPlugin({
    entries: true,
    modules: true,
    modulesCount: 1500,
  }),
  new webpack.DefinePlugin({
    'process.env': JSON.stringify({ NODE_ENV: 'development' }),
    ENV_CONFIG: `{ config: ${fs.readFileSync(uiConfigPath).toString()} }`,
  }),
  new ExtractCssChunks(),
];

const optimization = {
  minimize: false,
  splitChunks: {
    cacheGroups: {
      vendors: {
        name: 'chunks/vendors',
        test: (module) =>
          /[\\/]node_modules[\\/]/.test(module.resource || '') &&
          /javascript|json/.test(module.type),
        priority: -10,
        chunks: 'all',
      },
      // Make a separate chunk for each feature folder to avoid bundling a
      // single huge entry file
      ...(isTest ? null : getFeatureChunkGroups()),
    },
    chunks: 'all',
  },
  runtimeChunk: 'single',
  removeAvailableModules: false,
  removeEmptyChunks: false,
};

const devtool = 'eval-cheap-source-map';

const keyFile = process.env.HTTPS_KEY_FILE;
const certFile = process.env.HTTPS_CERT_FILE;

const devServer = {
  contentBase: false,
  // use https if key and cert files are provided through env variables
  https:
    keyFile && certFile
      ? {
          key: keyFile,
          cert: certFile,
        }
      : undefined,
  port: 3001,
  hot: !isTest,
  historyApiFallback: true,
  overlay: false,
  // this middleware delays all requests to the dev server until compilation is complete
  before: (app, _server, compiler) => {
    const readyPromise = new Promise((resolve) => {
      compiler.hooks.done.tap('delay-pre-compilation-requests', () => resolve());
    });

    app.use('*', (_req, _res, next) => readyPromise.then(next));
  },
};

function getFeatureChunkGroups() {
  const featuresFolder = path.resolve(__dirname, '..', 'src', 'javascripts', 'features');
  const features = glob.sync('*', { cwd: featuresFolder, dir: true });
  return features.reduce((acc, feature) => {
    const featurePath = path.join(featuresFolder, feature);

    acc[feature] = {
      test: (module) =>
        (module.resource || '').startsWith(featurePath) && module.type === 'javascript/auto',
      name: `chunks/feature-${feature}`,
      chunks: 'async',
    };
    return acc;
  }, {});
}

module.exports = {
  mode,
  output,
  rules,
  target,
  plugins,
  optimization,
  devtool,
  devServer,
};
