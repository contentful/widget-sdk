const merge = require('webpack-merge');
const createWebpackConfig = require('../webpack.config');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const baseConfig = createWebpackConfig();

module.exports = merge(baseConfig, {
  plugins: [new BundleAnalyzerPlugin()],
});
