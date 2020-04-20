const parser = require('@babel/parser');
const _ = require('lodash');
const findImports = require('./analyzers/findImports');
const findAngular = require('./analyzers/findAngular');
const findOtherByRegexp = require('./analyzers/findOtherByRegexp');
const findComponentLibrary = require('./analyzers/findComponentLibrary');
const findGetModule = require('./analyzers/findGetModule');

module.exports = function (node, src) {
  if (['.js', '.ts', '.tsx'].includes(node.extension)) {
    const ast = parser.parse(src, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'objectRestSpread',
        'typescript',
      ],
    });

    const fnParams = {
      src,
      ast,
    };

    const fns = [findImports, findAngular, findOtherByRegexp, findComponentLibrary, findGetModule];

    const modules = _.uniq(
      _.flatMap(fns, (fn) => {
        return fn(fnParams);
      })
    );

    return modules;
  }
  if (node.extension === '.jade') {
    const fnParams = {
      src,
    };
    const fns = [findOtherByRegexp, findComponentLibrary];

    return _.uniq(
      _.flatMap(fns, (fn) => {
        return fn(fnParams);
      })
    );
  }
  return [];
};
