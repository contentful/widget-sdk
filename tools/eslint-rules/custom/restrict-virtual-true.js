const resolve = require('eslint-module-utils/resolve');

module.exports = {
  meta: {},
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object && node.object.name === 'jest') {
          if (node.property && node.property.name === 'mock') {
            const mockArguments = node.property.parent.parent.arguments;

            if (mockArguments.length < 3) {
              return;
            }

            const importName = mockArguments[0].value;
            const virtualOption = mockArguments[2].properties.find(
              (prop) => prop.key.name === 'virtual' && prop.value.value === true
            );

            if (virtualOption) {
              const resolved = !!resolve.default(importName, context);

              if (resolved) {
                context.report({
                  node: virtualOption,
                  message: '`virtual: true` is not allowed for resolvable imports.',
                });
              }
            }
          }
        }
      },
    };
  },
};
