module.exports = {
  meta: {
    docs: {
      description: 'Allow only imports and exports in index.js files',
      category: 'Best Practices',
    },
  },
  create(context) {
    const path = context.getFilename();
    if (!path.endsWith('index.js') && !path.endsWith('index.ts')) {
      return {};
    }
    return {
      Program: (node) => {
        node.body.forEach((childNode) => {
          const complain = () => {
            context.report({
              node: childNode,
              message: "Please don't use anything except import / export in index files.",
            });
          };
          if (['ExportNamedDeclaration', 'ExportDefaultDeclaration'].includes(childNode.type)) {
            if (childNode.declaration) {
              complain();
            }
          } else {
            if (childNode.type !== 'ImportDeclaration') {
              complain();
            }
          }
        });
      },
    };
  },
};
