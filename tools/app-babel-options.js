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

  // If you add presets or plugins make sure to remove the supported
  // syntax from the ESLint blacklist in src/javascripts/.eslint-es6.yml
  presets: [],
  plugins: [
    ['transform-es2015-modules-systemjs'],
    // Transforms 'const' and 'let' to 'var' with block scope
    ['transform-es2015-block-scoping'],
    // Make sure 'const' variables are not reassigned
    ['check-es2015-constants'],
    ['transform-es2015-template-literals'],
    ['transform-es2015-arrow-functions']
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
