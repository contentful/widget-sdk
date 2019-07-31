module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow getModule usage globally in a module. Enforce that it's called only inside a function that needs the injected module.",
      category: 'Best Practices'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        const calleeType = node.callee ? node.callee.type : '';
        const fnName = node.callee && node.callee.name ? node.callee.name : '';

        if (calleeType === 'Identifier' && fnName === 'getModule') {
          const isTopLevelCall = node.parent.parent.parent.parent === null;

          if (isTopLevelCall) {
            context.report({
              node,
              message:
                "Please use getModule inside the function that requires the dependency it's injecting. The current usage pattern blocks our migration to webpack for the application bundle."
            });
          }
        }
      }
    };
  }
};
