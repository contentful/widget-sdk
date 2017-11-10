import * as P from 'path'

// This modules exports the Babel options to compile files matching
// 'src/javascript/**/*.es6.js.
//
// The options are used in 'gulpfile.js' and 'karma.conf.js'


// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts')

export const options = {
  moduleIds: true,
  only: /\.es6\.js$/,
  babelrc: false,

  presets: [
    ['env', {
      'targets': {
        'browsers': ['last 2 versions', 'ie >= 11']
      },
      'loose': true,
      'debug': true,
      'modules': false,
      // TODO we want to use 'useBuiltIns': 'entry' to reduce bundle size,
      // but first we heed to pipe `libs/index` through babel.
      'useBuiltIns': false
    }]
  ],
  plugins: [
    ['transform-es2015-modules-systemjs', {
      systemGlobal: 'AngularSystem'
    }]
  ],

  // Get the SystemJS module ID from the source path
  // src/javascripts/a/b/x.es6.js -> a/b/x
  getModuleId: function (path) {
    const absPath = P.resolve(path)
    if (absPath.startsWith(basePath)) {
      return absPath
        .replace(/\.es6$/, '')
        .replace(basePath + '/', '')
    } else {
      return path
    }
  }
}
