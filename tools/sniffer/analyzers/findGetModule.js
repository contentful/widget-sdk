const traverse = require('@babel/traverse').default;

module.exports = function findGetModule({ src, ast }) {
  function isRegistryUsed() {
    const moduleRe = /\b(require|import)\b/;

    let isUsed = false;

    if (moduleRe.test(src)) {
      traverse(ast, {
        enter(path) {
          if (path.node.type === 'ImportDeclaration') {
            const { source } = path.node;
            if (source && source.value && source.value === 'NgRegistry.es6') {
              (path.node.specifiers || []).forEach(item => {
                if (
                  item.type === 'ImportSpecifier' &&
                  (item.imported.name === 'getModule' || item.imported.name === 'getModules')
                ) {
                  isUsed = true;
                }
              });
            }
          }
        }
      });
    }

    return isUsed;
  }

  function findGetModule(moduleName) {
    const modules = [];
    traverse(ast, {
      enter(path) {
        if (path.node.type === 'CallExpression') {
          const callee = path.get('callee');
          if (callee.type === 'Identifier' && callee.node.name === moduleName) {
            const args = path.node.arguments;
            args.forEach(arg => {
              if (arg.type === 'StringLiteral') {
                modules.push(arg.value);
              }
            });
          }
        }
      }
    });
    return modules;
  }

  if (!ast) {
    return [];
  }

  if (!isRegistryUsed()) {
    return [];
  }

  return [...findGetModule('getModule'), ...findGetModule('getModules')];
};
