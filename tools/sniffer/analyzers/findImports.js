const traverse = require('@babel/traverse').default;

module.exports = function findImports({ src, ast }) {
  const moduleRe = /\b(require|import|export)\b/;

  if (!moduleRe.test(src)) {
    return [];
  }

  const modules = [];

  traverse(ast, {
    enter(path) {
      if (path.node.type === 'CallExpression') {
        const callee = path.get('callee');
        const isDynamicImport = callee.isImport();
        if (callee.isIdentifier({ name: 'require' }) || isDynamicImport) {
          const arg = path.node.arguments[0];
          if (arg.type === 'StringLiteral') {
            modules.push(arg.value);
          }
        }
      } else if (
        path.node.type === 'ImportDeclaration' ||
        path.node.type === 'ExportNamedDeclaration' ||
        path.node.type === 'ExportAllDeclaration'
      ) {
        const { source } = path.node;
        if (source && source.value) {
          modules.push(source.value);
        }
      }
    }
  });

  return modules
    .filter(
      // filter out relative modules
      module => module.indexOf('./') === -1
    )
    .map(item => {
      if (item === '@contentful/ui-component-library') {
        return '@contentful/forma-36-react-components';
      }
      return item;
    });
};
