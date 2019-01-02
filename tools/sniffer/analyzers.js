const parser = require('@babel/parser');
const _ = require('lodash');
const findImports = require('./analyzers/findImports');
const findServiceConsumer = require('./analyzers/findServiceConsumer');
const findAngular = require('./analyzers/findAngular');
const findOtherByRegexp = require('./analyzers/findOtherByRegexp');
const findComponentLibrary = require('./analyzers/findComponentLibrary');
const findGetModule = require('./analyzers/findGetModule');

module.exports = function(node, src) {
  if (node.extension === '.js') {
    const ast = parser.parse(src, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'objectRestSpread'
      ]
    });

    const fnParams = {
      src,
      ast
    };

    const fns = [
      findImports,
      findAngular,
      findServiceConsumer,
      findOtherByRegexp,
      findComponentLibrary,
      findGetModule
    ];

    const modules = _.uniq(
      _.flatMap(fns, fn => {
        return fn(fnParams);
      })
    )
      // remove .es6 from all module names
      .map(name => name.replace('.es6', ''));

    return modules;
  }
  if (node.extension === '.jade') {
    const fnParams = {
      src
    };
    const fns = [findOtherByRegexp, findComponentLibrary];

    return _.uniq(
      _.flatMap(fns, fn => {
        return fn(fnParams);
      })
    );
  }
  return [];
};
