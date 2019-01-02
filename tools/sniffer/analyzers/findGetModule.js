const traverse = require('@babel/traverse').default;
const _ = require('lodash');

module.exports = function findGetModule({ src, ast }) {
  function getUsedModules() {
    const moduleRe = /\b(require|import)\b/;

    const usedModules = [];

    if (moduleRe.test(src)) {
      traverse(ast, {
        enter(path) {
          if (path.node.type === 'ImportDeclaration') {
            const { source } = path.node;
            if (source && source.value && source.value === 'NgRegistry.es6') {
              (path.node.specifiers || []).forEach(item => {
                if (item.type === 'ImportSpecifier') {
                  usedModules.push(item.imported.name);
                }
              });
            }
          }
        }
      });
    }

    return usedModules;
  }

  function findGetModule(moduleName) {
    let modules = [];
    traverse(ast, {
      enter(path) {
        if (path.node.type === 'CallExpression') {
          const callee = path.get('callee');
          if (callee.type === 'Identifier' && callee.node.name === moduleName) {
            const args = path.node.arguments;

            const readArgsAsDeps = args => {
              if (_.isArray(args)) {
                return _.map(args, arg => {
                  if (arg.type === 'StringLiteral') {
                    return arg.value;
                  }
                  return null;
                }).filter(_ => _);
              }
              return [];
            };

            switch (moduleName) {
              case 'getModule':
              case 'getModules': {
                modules = [...modules, ...readArgsAsDeps(args)];
                break;
              }

              case 'registerController':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.controller');
                break;

              case 'registerDirective':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.directive');
                break;

              case 'registerFilter':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.filter');
                break;

              case 'registerFactory':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.factory');
                break;

              case 'registerService':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.service');
                break;

              case 'registerConstant':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.constant');
                break;

              case 'registerProvider':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.provider');
                break;

              case 'registerValue':
                modules = [...modules, ...readArgsAsDeps(args[1].elements)];
                modules.push('angular.value');
                break;
            }
          }
        }
      }
    });
    return modules;
  }

  if (!ast) {
    return [];
  }

  const usedModules = getUsedModules();

  return usedModules.reduce((acc, item) => {
    return acc.concat(findGetModule(item));
  }, []);
};
