const { promisify } = require('util');
const webpack = require('webpack');
const createWebpackConfig = require('./webpack.config');

function watch(done, callbacks) {
  // we don't wait until JS is bundles to not to block
  // other tasks which `serve` task might have
  done && done();
  const config = createWebpackConfig({ dev: true });
  const compiler = webpack(config);
  compiler.watch(
    {
      aggregateTimeout: 300,
      poll: 1000
    },
    (err, stats) => {
      handleCompileResults(err, stats, config, callbacks);
    }
  );
}

async function build() {
  const config = createWebpackConfig({ dev: false });
  const compiler = webpack(config);
  const stats = await promisify(compiler.run.bind(compiler))();

  const info = stats.toJson({ chunks: false });

  if (stats.hasErrors()) {
    info.errors.forEach(error => {
      console.error(error);
    });
    throw new Error('Webpack failed to compile');
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(stats.toString(config.stats));
}

function handleCompileResults(err, stats, config, { onSuccess, onError } = {}) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    onError && onError(err);
    return;
  }

  onSuccess && onSuccess();

  const info = stats.toJson({ chunks: false });
  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(stats.toString(config.stats));
}

module.exports.watch = watch;
module.exports.build = build;
