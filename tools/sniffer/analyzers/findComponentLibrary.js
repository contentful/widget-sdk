const traverse = require('@babel/traverse').default;

module.exports = function findComponentLibrary({ src, ast }) {
  const usages = [];

  if (ast) {
    const moduleRe = /\b(require|import)\b/;

    if (moduleRe.test(src)) {
      traverse(ast, {
        enter(path) {
          if (path.node.type === 'ImportDeclaration') {
            const { source } = path.node;
            if (
              source &&
              source.value &&
              (source.value === '@contentful/forma-36-react-components' ||
                source.value === '@contentful/ui-component-library')
            ) {
              const specifiers = path.node.specifiers || [];
              specifiers
                .filter(item => item.type === 'ImportSpecifier')
                .forEach(item => {
                  usages.push(`@contentful/forma-36-react-components/${item.imported.name}`);
                });
            }
          }
        }
      });
    }
  }

  // eslint-disable-next-line
  const legacyLibraryRegex = /(\@contentful\/ui-component-library\/\w+)/g;
  // eslint-disable-next-line
  const libraryRegex = /(\@contentful\/forma-36-react-components\/\w+)/g;
  const matches = src.match(legacyLibraryRegex) || [];
  matches.concat(src.match(libraryRegex) || []);
  if (matches.length > 0) {
    usages.push('@contentful/forma-36-react-components');
  }
  matches.forEach(item => usages.push(item));

  return usages;
};
