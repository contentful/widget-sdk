const gulp = require('gulp');
const webpack = require('webpack');
const createWebpackConfig = require('../webpack.config');

let compiler;
let cb;

gulp.task('js:watch', ['js/vendor/sharejs', 'js/vendor/kaltura'], watch);

gulp.task('js', ['js/vendor/sharejs', 'js/vendor/kaltura'], build);

function watch (newCb) {
  cb = newCb;
  if (!compiler) {
    const config = createWebpackConfig({ dev: true });
    compiler = webpack(config);
    compiler.watch(
      {
        aggregateTimeout: 300,
        poll: 1000
      },
      (err, stats) => {
        if (cb) {
          cb();
          cb = null;
          handleCompileResults(err, stats, config);
        } else {
          handleCompileResults(err, stats, config);
        }
      }
    );
  }
}

function build (cb) {
  const config = createWebpackConfig({ dev: false });
  const compiler = webpack(config);
  compiler.run((err, stats) => {
    handleCompileResults(err, stats, config);
    cb();
  });
}

function handleCompileResults (err, stats, config) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson({chunks: false});
  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(stats.toString(config.stats));
}
