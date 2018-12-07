const registrationFuncs = [
  'registerDirective',
  'registerController',
  'registerFilter',
  'registerService',
  'registerFactory'
];

module.exports = {
  meta: {
    messages: {
      doNotUseRequire:
        'Do not use `require` when registering an Angular component via the utility methods. Use explicit dependency injection instead'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (registrationFuncs.includes(node.callee.name)) {
          const definition = node.arguments[1];

          if (definition && definition.type === 'ArrayExpression') {
            const elements = definition.elements;
            const requireDependency = elements.find(e => e.value === 'require');

            if (requireDependency) {
              context.report({
                node: requireDependency,
                messageId: 'doNotUseRequire'
              });
              return;
            }
          }
        }
      }
    };
  }
};
