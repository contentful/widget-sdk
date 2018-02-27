const gulp = require('gulp');
const webpack = require('webpack');
const createWebpackConfig = require('../webpack.config');

let compiler;
let cb;

gulp.task('js:watch', ['js/vendor/sharejs', 'js/vendor/kaltura'], function (newCb) {
  cb = newCb;
  if (!compiler) {
    compiler = webpack(createWebpackConfig({ dev: true }));
    compiler.watch({
      aggregateTimeout: 300,
      poll: 1000
    }, (err) => {
      if (cb) {
        cb();
        cb = null;
      }

      if (err) {
        console.error('error during webpack compilation', err);
      } else {
        // TODO add stats logging
        // console.log(stats)
      }
    });
  }
});

gulp.task('js', ['js/vendor/sharejs', 'js/vendor/kaltura'], function (cb) {
  const compiler = webpack(createWebpackConfig({ dev: false }));
  compiler.run(function (err) {
    if (err) {
      console.error(err);
    }
    cb();
  });
});
