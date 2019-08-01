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
      // this selector matches a top level call to any function by it's name
      'Program > VariableDeclaration > VariableDeclarator > CallExpression > Identifier': node => {
        const calleeType = node.type;
        const fnName = node.name;

        if (calleeType === 'Identifier' && fnName === 'getModule') {
          context.report({
            node,
            message:
              "Please use getModule inside the function that requires the dependency it's injecting. The current usage pattern blocks our migration to webpack for the application bundle."
          });
        }
      }
    };
  }
};
